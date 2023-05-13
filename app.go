package main

import (
	"context"
	"fmt"
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

// Register global hotkey to hide/show the application
func (a *App) SetToggleHotkey(mods []hotkey.Modifier, key hotkey.Key) error {
	if a.ghk != nil {
		err := a.ghk.Unregister()
		runtime.LogDebug(a.ctx, fmt.Sprintf("Unregister old hotkey[%s]", a.ghk.String()))
		if err != nil {
			return err
		}
		runtime.LogDebug(a.ctx, "Unregistered old hotkey")
	}

	a.ghk = hotkey.New(mods, key)
	runtime.LogDebug(a.ctx, fmt.Sprintf("Register hotkey[%s]", a.ghk.String()))
	err := a.ghk.Register()
	if err != nil {
		return err
	}
	runtime.LogDebug(a.ctx, "Registered hotkey")

	go func() {
		visible := true
		for {
			_, ok := <-a.ghk.Keydown()
			if !ok {
				runtime.LogDebug(a.ctx, "Keydown channel closed")
				return
			}
			runtime.LogDebug(a.ctx, "Keydown event received")
			visible = !visible
			if visible {
				runtime.WindowShow(a.ctx)
			} else {
				runtime.WindowHide(a.ctx)
			}
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
