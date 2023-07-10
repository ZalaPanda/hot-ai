package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/danieloliveira085/autostarter"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/hotkey"
)

// App struct
type App struct {
	ctx context.Context
	ghk *hotkey.Hotkey
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Before close a `save-bounds` event is emitted with the current window bounds
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	if runtime.WindowIsMinimised(a.ctx) {
		runtime.WindowUnminimise(a.ctx)
	}
	if runtime.WindowIsMaximised(a.ctx) {
		runtime.WindowUnmaximise(a.ctx)
	}

	// Get normal window bounds
	cx, cy := runtime.WindowGetPosition(a.ctx)
	cw, ch := runtime.WindowGetSize(a.ctx)
	runtime.LogDebug(a.ctx, fmt.Sprintf("Before close bounds [%d, %d, %d, %d]", cx, cy, cw, ch))

	bounds := [4]int{cx, cy, cw, ch}
	runtime.EventsEmit(a.ctx, "save-bounds", bounds) // TODO: check if this is sync!
	return false
}

// Set window position and size
func (a *App) SetWindowBounds(bounds [4]int) {
	sx, sy, sw, sh := bounds[0], bounds[1], bounds[2], bounds[3]
	runtime.LogDebug(a.ctx, fmt.Sprintf("Setting window bounds [%d, %d, %d, %d]", sx, sy, sw, sh))
	runtime.WindowSetPosition(a.ctx, sx, sy)
	runtime.WindowSetSize(a.ctx, sw, sh)

	// Ensure window fits within screen bounds
	runtime.WindowFullscreen(a.ctx)
	cx, cy := runtime.WindowGetPosition(a.ctx)
	cw, ch := runtime.WindowGetSize(a.ctx)
	runtime.WindowUnfullscreen(a.ctx)

	// Check if window is offscreen
	if !(sx >= cx && sx <= cx+cw && sy >= cy && sy <= cy+ch) {
		runtime.LogDebug(a.ctx, fmt.Sprintf("Screen bounds [%d, %d, %d, %d]", cx, cy, cw, ch))
		runtime.LogDebug(a.ctx, "Window offscreen")
		runtime.WindowCenter(a.ctx)
	}
}

// Register global hotkey to hide/show the application
func (a *App) SetToggleHotkey(mods []hotkey.Modifier, key hotkey.Key) error {
	if a.ghk != nil {
		runtime.LogDebug(a.ctx, fmt.Sprintf("Unregister old hotkey [%s]", a.ghk.String()))
		err := a.ghk.Unregister()
		if err != nil {
			return err
		}
		runtime.LogDebug(a.ctx, "Unregistered old hotkey")
		a.ghk = nil
	}

	ghk := hotkey.New(mods, key)
	runtime.LogDebug(a.ctx, fmt.Sprintf("Register hotkey [%s]", ghk.String()))
	err := ghk.Register()
	if err != nil {
		return err
	}
	runtime.LogDebug(a.ctx, "Registered hotkey")
	a.ghk = ghk

	go func() {
		for {
			_, ok := <-a.ghk.Keydown()
			if !ok {
				runtime.LogDebug(a.ctx, "Keydown channel closed")
				return
			}
			runtime.LogDebug(a.ctx, "Keydown event received")
			runtime.EventsEmit(a.ctx, "hotkey-press")
		}
	}()
	return nil
}

// Helper to get Autostart for current executable
func GetAutostarter() (*autostarter.Autostart, error) {
	executable, err := os.Executable()
	if err != nil {
		return nil, err
	}
	return autostarter.NewAutostart(
		autostarter.Shortcut{
			Name: "hot-ai",
			Exec: executable,
		},
		autostarter.DefaultIcon), nil
}

// Check if there is an autostart already set
func (a *App) GetAutostarterEnabled() (bool, error) {
	as, err := GetAutostarter()
	if err != nil {
		return false, err
	}
	return as.IsEnabled(), nil
}

// Adds/removes autostart
func (a *App) SetAutostarterEnabled(enable bool) error {
	as, err := GetAutostarter()
	if err != nil {
		return err
	}
	if as.IsEnabled() == enable {
		return nil
	}
	if enable {
		return as.Enable()
	} else {
		return as.Disable()
	}
}

type wailsJsonStruct struct {
	Info struct {
		CurrentVersion string `json:"productVersion"`
	} `json:"info"`
}

type githubReleaseStruct struct {
	Name          string `json:"name"`
	LatestVersion string `json:"tag_name"`
	Url           string `json:"html_url"`
}

type Update struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	Name           string `json:"name"`
	Url            string `json:"url"`
}

//go:embed wails.json
var wailsJson string

// Compare version number from wails.json with
// latest release tag from github
func (a *App) CheckForUpdate() *Update {
	var current *wailsJsonStruct
	err := json.Unmarshal([]byte(wailsJson), &current)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to get wails.json: %v", err)
		return nil
	}

	url := "https://api.github.com/repos/ZalaPanda/hot-ai/releases/latest"
	resp, err := http.Get(url)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to get latest release: %v", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		runtime.LogErrorf(a.ctx, "Failed to load latest release: %s", resp.Status)
		return nil
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to read latest release: %v", err)
		return nil
	}
	var release *githubReleaseStruct
	err = json.Unmarshal(body, &release)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to parse latest release: %v", err)
		return nil
	}
	runtime.LogDebugf(a.ctx, "Current version: %s", current.Info.CurrentVersion)
	runtime.LogDebugf(a.ctx, "Latest version: %s", release.LatestVersion)

	if current.Info.CurrentVersion == release.LatestVersion {
		return nil
	}

	return &Update{
		CurrentVersion: current.Info.CurrentVersion,
		LatestVersion:  release.LatestVersion,
		Name:           release.Name,
		Url:            release.Url,
	}
}
