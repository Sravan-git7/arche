import cv2
import numpy as np

# Load images
im_a = cv2.imread('d:/arche/public/arche-logo-a.png', cv2.IMREAD_UNCHANGED)
im_c = cv2.imread('d:/arche/public/arche-logo-c.png', cv2.IMREAD_UNCHANGED)

# Let's inspect the exact outline contours of A and C
def get_svg_outline(im, threshold=50):
    alpha = (im[:, :, 3] > threshold).astype(np.uint8) * 255
    contours, hier = cv2.findContours(alpha, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    # Return SVG path data for all contours
    path_d = []
    for c in contours:
        pts = cv2.approxPolyDP(c, 1.0, True).reshape(-1, 2)
        if len(pts) < 3:
            continue
        d = f"M {pts[0][0]} {pts[0][1]}"
        for pt in pts[1:]:
            d += f" L {pt[0]} {pt[1]}"
        d += " Z"
        path_d.append(d)
    return " ".join(path_d)

path_a_outline = get_svg_outline(im_a)
path_c_outline = get_svg_outline(im_c)

print("A outline length:", len(path_a_outline))
print("C outline length:", len(path_c_outline))
