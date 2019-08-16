import { implementsFunction } from "@thi.ng/checks";
import { isNumber } from "@thi.ng/checks";
import { ReadonlyVec } from "@thi.ng/vectors";
import { IGridLayout, ILayout, LayoutBox } from "./api";

const DEFAULT_SPANS: [number, number] = [1, 1];

export class GridLayout implements IGridLayout {
    readonly parent: GridLayout | null;
    readonly cols: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
    readonly cellW: number;
    readonly cellH: number;
    readonly cellWG: number;
    readonly cellHG: number;
    readonly gap: number;

    protected currCol: number;
    protected currRow: number;
    protected rows: number;

    constructor(
        parent: GridLayout | null,
        x: number,
        y: number,
        width: number,
        cols: number,
        rowH: number,
        gap: number
    ) {
        this.parent = parent;
        this.cols = cols;
        this.x = x;
        this.y = y;
        this.width = width;
        this.cellW = (width - (cols - 1) * gap) / cols;
        this.cellH = rowH;
        this.cellWG = this.cellW + gap;
        this.cellHG = rowH + gap;
        this.gap = gap;
        this.currCol = 0;
        this.currRow = 0;
        this.rows = 0;
    }

    colsForWidth(w: number) {
        return Math.ceil(w / this.cellWG);
    }

    rowsForHeight(h: number) {
        return Math.ceil(h / this.cellHG);
    }

    spansForSize(size: ReadonlyVec): [number, number];
    spansForSize(w: number, h: number): [number, number];
    spansForSize(w: ReadonlyVec | number, h?: number): [number, number] {
        const [ww, hh] = isNumber(w) ? [w, h!] : w;
        return [this.colsForWidth(ww), this.rowsForHeight(hh)];
    }

    next(spans = DEFAULT_SPANS) {
        const { cellWG, cellHG, gap, cols } = this;
        const cspan = Math.min(spans[0], cols);
        const rspan = spans[1];
        if (this.currCol > 0) {
            if (this.currCol + cspan > cols) {
                this.currCol = 0;
                this.currRow = this.rows;
            }
        } else {
            this.currRow = this.rows;
        }
        const h = rspan * cellHG - gap;
        const cell = <LayoutBox>{
            x: this.x + this.currCol * cellWG,
            y: this.y + this.currRow * cellHG,
            w: cspan * cellWG - gap,
            h,
            cw: this.cellW,
            ch: this.cellH,
            gap
        };
        this.propagateSize(rspan);
        this.currCol = Math.min(this.currCol + cspan, cols) % cols;
        return cell;
    }

    nextSquare() {
        const box = this.next([
            1,
            Math.ceil(this.cellW / (this.cellH + this.gap)) + 1
        ]);
        box.h = box.w;
        return box;
    }

    nest(cols: number, spans?: [number, number]) {
        const { x, y, w } = this.next(spans);
        return new GridLayout(this, x, y, w, cols, this.cellH, this.gap);
    }

    /**
     * Updates max rows used in this layout and all of its parents.
     *
     * @param rspan
     */
    protected propagateSize(rspan: number) {
        let rows = this.rows;
        this.rows = rows = Math.max(rows, this.currRow + rspan);
        const parent = this.parent;
        parent && parent.propagateSize(rows);
    }
}

/**
 * Syntax sugar for `GridLayout` ctor. By default creates a
 * single-column layout at given position and width.
 *
 * @param x
 * @param y
 * @param width
 * @param cols
 * @param rowH
 * @param gap
 */
export const gridLayout = (
    x: number,
    y: number,
    width: number,
    cols = 1,
    rowH = 16,
    gap = 4
) => new GridLayout(null, x, y, width, cols, rowH, gap);

export const layoutBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    cw: number,
    ch: number,
    gap: number
) => ({ x, y, w, h, cw, ch, gap });

export const isLayout = (x: any): x is ILayout<any, any> =>
    implementsFunction(x, "next");
