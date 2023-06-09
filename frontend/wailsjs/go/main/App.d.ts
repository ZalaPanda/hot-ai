// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';
import {hotkey} from '../models';

export function CheckForUpdate():Promise<main.Update>;

export function GetAutostarterEnabled():Promise<boolean>;

export function GetKeys():Promise<{[key: string]: hotkey.Key}>;

export function GetModifiers():Promise<{[key: string]: hotkey.Modifier}>;

export function SetAutostarterEnabled(arg1:boolean):Promise<void>;

export function SetToggleHotkey(arg1:Array<hotkey.Modifier>,arg2:hotkey.Key):Promise<void>;

export function SetWindowBounds(arg1:any):Promise<void>;
