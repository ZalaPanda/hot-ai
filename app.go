package main

import (
	"context"
	"fmt"

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

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	runtime.LogDebug(a.ctx, "Greet called")
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) SetToggleHotkey(key string) string {
	if a.ghk != nil {
		err := a.ghk.Unregister()
		runtime.LogDebug(a.ctx, "Unregister old hotkey")
		if err != nil {
			panic(err)
		}
	}

	a.ghk = hotkey.New([]hotkey.Modifier{hotkey.ModAlt, hotkey.ModShift}, hotkey.KeyS)
	runtime.LogDebug(a.ctx, "Register hotkey")
	err := a.ghk.Register()
	if err != nil {
		panic(err)
	}
	runtime.LogDebug(a.ctx, "Registered hotkey")

	// go func() {
	// 	a.ghk <- hotkey.Event{}
	// 	fmt.Println("Sent to channel")
	// }()

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
	return "OK"
}
