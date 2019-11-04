import { ensureArray } from "@thi.ng/arrays";
import { illegalArgs } from "@thi.ng/errors";

/**
 * Yields iterator of `src` with the last `numLeft` values of `src`
 * prepended at the beginning and/or the first `numRight` values
 * appended at the end. `numLeft` defaults to 1 and `numRight` defaults
 * to same value as `numLeft`, therefore wraps both sides by default and
 * throws error if either `nXXX` < 0 or larger than `src.length`.
 *
 * @see extendSides
 * @see padSides
 *
 * @param src
 * @param numLeft
 * @param numRight
 */
export function* wrapSides<T>(
    src: Iterable<T>,
    numLeft = 1,
    numRight = numLeft
) {
    const _src: T[] = ensureArray(src);
    (numLeft < 0 ||
        numLeft > _src.length ||
        numRight < 0 ||
        numRight > _src.length) &&
        illegalArgs(
            `wrong number of wrap items: got ${numLeft}, but max: ${_src.length}`
        );
    if (numLeft > 0) {
        for (let m = _src.length, i = m - numLeft; i < m; i++) {
            yield _src[i];
        }
    }
    yield* _src;
    if (numRight > 0) {
        for (let i = 0; i < numRight; i++) {
            yield _src[i];
        }
    }
}