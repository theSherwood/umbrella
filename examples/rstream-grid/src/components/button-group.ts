import { button } from "./button";
import type { AppContext } from "../api";

export const buttonGroup = (ctx: AppContext, ...buttons: any[]) => [
    "section",
    ctx.ui.buttongroup,
    buttons.map((bt) => [button, ...bt])
];
