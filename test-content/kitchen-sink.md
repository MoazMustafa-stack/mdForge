# The Kitchen Sink Test

A comprehensive test file containing a mix of all supported syntax to ensure layout stability.

## Section 1: Formatting Mix

**Welcome** to the *Kitchen Sink* test. We are testing how `mdForge` handles a ~~messy~~ complex document.

> "The computer was born to solve problems that did not exist before." - Bill Gates (maybe)

### Sub-section: Lists in Quotes
> - List item inside a quote
> - Another item
>   1. Nested ordered list
>   2. With more complexity

## Section 2: Technical Details

### Binary Search in Python
```python
def binary_search(arr, low, high, x):
    if high >= low:
        mid = (high + low) // 2
        if arr[mid] == x:
            return mid
        elif arr[mid] > x:
            return binary_search(arr, low, mid - 1, x)
        else:
            return binary_search(arr, mid + 1, high, x)
    else:
        return -1
```

### Configuration Table
| Setting | Value | Description |
| --- | --- | --- |
| `theme` | `90s-retro` | The default UI theme |
| `loading` | `true` | Show fake loading screen |
| `input` | `./test-content` | Where we look for md |

## Section 3: Final Checks

---

1. [x] Syntax highlighting
2. [x] Table rendering
3. [x] Link stability: [Check README](../README.md)

Enjoy your generated site!
