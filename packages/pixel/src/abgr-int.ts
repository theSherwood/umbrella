import { IObjectOf } from "@thi.ng/api";
import { lane8, Lane8, setLane8 } from "@thi.ng/binary";
import { Channel, IColorChannel, IPixelBuffer } from "./api";
import { imageCanvas } from "./canvas";
import { Uint8Buffer } from "./uint8";
import { abgrToGrayU8, blit1, ensureSize } from "./utils";

const LANES = <IObjectOf<Lane8>>{
    [Channel.ALPHA]: 0,
    [Channel.RED]: 3,
    [Channel.GREEN]: 2,
    [Channel.BLUE]: 1
};

/**
 * Buffer of 32bit packed ABGR values (in the native byte order as used
 * by `ImageData`).
 */
export class ABGRBuffer
    implements IPixelBuffer<Uint32Array, number>, IColorChannel<Uint8Array> {
    /**
     * Takes a fully initialized image element and returns a
     * `ABGRBuffer` instance of its contents. Optionally, a target size
     * can be given to obtain the pixels of a resized version.
     *
     * @param img
     * @param width
     * @param height
     */
    static fromImage(img: HTMLImageElement, width?: number, height = width) {
        const ctx = imageCanvas(img, width, height);
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        return new ABGRBuffer(
            w,
            h,
            new Uint32Array(ctx.ctx.getImageData(0, 0, w, h).data.buffer)
        );
    }

    /**
     * Async version of `fromImage()`.
     *
     * @param img
     * @param width
     * @param height
     */
    static async fromImagePromise(
        img: Promise<HTMLImageElement>,
        width?: number,
        height = width
    ) {
        return ABGRBuffer.fromImage(await img, width, height);
    }

    width: number;
    height: number;
    pixels: Uint32Array;

    constructor(width: number, height = width, pixels?: Uint32Array) {
        this.width = width;
        this.height = height;
        if (pixels) {
            ensureSize(pixels, width, height);
            this.pixels = pixels;
        } else {
            this.pixels = new Uint32Array(width * height);
        }
    }

    blit(buf: IPixelBuffer<Uint32Array, number>, x = 0, y = 0) {
        blit1(
            this.pixels,
            buf.pixels,
            x,
            y,
            this.width,
            this.height,
            buf.width,
            buf.height
        );
    }

    blitCanvas(canvas: HTMLCanvasElement, x = 0, y = 0) {
        const ctx = canvas.getContext("2d")!;
        const idata = ctx.getImageData(x, y, this.width, this.height);
        idata.data.set(
            new Uint8ClampedArray(
                this.pixels.buffer,
                0,
                this.width * this.height * 4
            )
        );
        ctx.putImageData(idata, x, y);
    }

    getAt(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height
            ? this.pixels[(x | 0) + (y | 0) * this.width]
            : 0;
    }

    setAt(x: number, y: number, col: number) {
        x >= 0 &&
            x < this.width &&
            y >= 0 &&
            y < this.height &&
            (this.pixels[(x | 0) + (y | 0) * this.width] = col);
        return this;
    }

    getChannel(id: Channel) {
        const dest = new Uint8Array(this.width * this.height);
        const src = this.pixels;
        const lane = LANES[id];
        for (let i = dest.length; --i >= 0; ) {
            dest[i] = lane8(src[i], lane);
        }
        return new Uint8Buffer(this.width, this.height, dest);
    }

    setChannel(id: Channel, buf: IPixelBuffer<Uint8Array, number>) {
        const src = buf.pixels;
        const dest = this.pixels;
        const lane = LANES[id];
        for (let i = dest.length; --i >= 0; ) {
            dest[i] = setLane8(dest[i], src[i], lane);
        }
        return this;
    }

    grayscale() {
        return new Uint8Buffer(
            this.width,
            this.height,
            abgrToGrayU8(this.pixels)
        );
    }
}