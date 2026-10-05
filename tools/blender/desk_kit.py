"""Generate the soft-stylized desk kit as GLBs.

Run from the portfolio root:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/desk_kit.py
Optional preview render (written to tools/blender/preview.png):
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/desk_kit.py -- --preview

Conventions (see docs/superpowers/specs/2026-10-05-soft-stylized-art-direction-design.md):
- Meters, Z-up, viewer stands at -Y. glTF export converts to three.js Y-up.
- Each prop is a root Empty at the origin, base on z=0.
- Hook meshes keep stable names: Screen, Shade, Bulb, Platter, PageLeft.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'models', 'kit')

PALETTE = {
    'night': '#12161e',
    'slate': '#33435a',
    'oak': '#b9805a',
    'oak_deep': '#7c5236',
    'paper': '#f1e6d0',
    'honey': '#f2aa4c',
    'sage': '#86a392',
    'sage_deep': '#5f7d6b',
    'clay': '#cf6f4e',
    'ink': '#1f232a',
    'graphite': '#3a3f48',
    'tea': '#7a4a22',
}


# ---------------------------------------------------------------- helpers

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


_materials = {}


def mat(key, rough=0.7, metal=0.0, emissive=None, strength=0.0):
    name = f'{key}_{rough}_{metal}_{emissive}'
    if name in _materials:
        return _materials[name]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hex_rgba(PALETTE[key])
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if emissive:
        bsdf.inputs['Emission Color'].default_value = hex_rgba(PALETTE[emissive])
        bsdf.inputs['Emission Strength'].default_value = strength
    _materials[name] = m
    return m


def new_obj(name, bm, material, parent, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, segments=3, smooth=True):
    # Recenter so the origin sits at the bounds center: hover outlines scale
    # each mesh about its own origin.
    verts = [v.co for v in bm.verts]
    lo = Vector((min(v.x for v in verts), min(v.y for v in verts), min(v.z for v in verts)))
    hi = Vector((max(v.x for v in verts), max(v.y for v in verts), max(v.z for v in verts)))
    center = (lo + hi) / 2
    bmesh.ops.translate(bm, verts=bm.verts, vec=-center)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.rotation_euler = rot
    ob.location = Vector(loc) + Euler(rot).to_matrix() @ center
    if bevel > 0:
        mod = ob.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = 'ANGLE'
        mod.harden_normals = True
    return ob


def box(size, offset=(0, 0, 0)):
    bm = bmesh.new()
    m = Matrix.Translation(offset) @ Matrix.Diagonal((size[0], size[1], size[2], 1))
    bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    return bm


def cyl(r1, r2, depth, segs=40, caps=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=segs,
                          radius1=r1, radius2=r2, depth=depth)
    return bm


def sphere(r, scale=(1, 1, 1), segs=24, rings=14):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r,
                              matrix=Matrix.Diagonal((*scale, 1)))
    return bm


def torus(R, r, arc=2 * math.pi, segs=32, tube=10):
    bm = bmesh.new()
    rings = []
    for i in range(segs + (0 if arc >= 2 * math.pi else 1)):
        a = arc * i / segs
        ring = []
        for j in range(tube):
            b = 2 * math.pi * j / tube
            d = R + r * math.cos(b)
            ring.append(bm.verts.new((d * math.cos(a), d * math.sin(a), r * math.sin(b))))
        rings.append(ring)
    closed = arc >= 2 * math.pi
    for i in range(len(rings) - (0 if closed else 1)):
        a, b = rings[i], rings[(i + 1) % len(rings)]
        for j in range(tube):
            bm.faces.new((a[j], a[(j + 1) % tube], b[(j + 1) % tube], b[j]))
    return bm


def lathe(profile, segs=48):
    """Revolve (radius, z) points around Z. First/last points on the axis close the shape."""
    bm = bmesh.new()
    rings = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile])
    for i in range(segs):
        a, b = rings[i], rings[(i + 1) % segs]
        for j in range(len(profile) - 1):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def plane(w, d):
    bm = bmesh.new()
    bm.loops.layers.uv.verify()  # create_grid only fills UVs into an existing layer
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5,
                          matrix=Matrix.Diagonal((w, d, 1, 1)), calc_uvs=True)
    return bm


def merge(*bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp')
        b.to_mesh(me)
        b.free()
        out.from_mesh(me)
        bpy.data.meshes.remove(me)
    return out


def root(name):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    return e


def empty(name, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    e = root(name)
    e.parent = parent
    e.location = loc
    e.rotation_euler = rot
    return e


# ---------------------------------------------------------------- props

def build_desk():
    r = root('desk')
    W, D, T, TOP = 3.0, 1.05, 0.045, 0.44
    new_obj('DeskTop', box((W, D, T)), mat('oak', 0.62), r, (0, 0, TOP - T / 2), bevel=0.012)
    new_obj('DeskApron', box((W - 0.12, 0.03, 0.1)), mat('oak_deep', 0.7), r,
            (0, -D / 2 + 0.06, TOP - T - 0.05), bevel=0.008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            new_obj('DeskLeg', box((0.06, 0.06, TOP - T)), mat('oak_deep', 0.7), r,
                    (sx * (W / 2 - 0.08), sy * (D / 2 - 0.08), (TOP - T) / 2), bevel=0.01)
    return r


def build_laptop():
    r = root('laptop')
    W, D = 0.36, 0.25
    shell = mat('graphite', 0.45, 0.25)
    new_obj('LaptopBase', box((W, D, 0.016)), shell, r, (0, 0, 0.008), bevel=0.006)
    keys = merge(*[
        box((0.022, 0.02, 0.004), (-0.135 + c * 0.0245, 0.02 + row * 0.024, 0))
        for row in range(4) for c in range(12)
    ], box((0.14, 0.02, 0.004), (0, -0.076 + 0.0, 0)))
    new_obj('LaptopKeys', keys, mat('paper', 0.6), r, (0, 0.0, 0.018), bevel=0.0015, segments=2)
    new_obj('LaptopPad', box((0.11, 0.06, 0.002)), mat('ink', 0.4), r, (0, -0.085, 0.0165), bevel=0.002)
    hinge = empty('LaptopHinge', r, (0, D / 2 - 0.006, 0.016), (math.radians(-14), 0, 0))
    new_obj('LaptopLid', box((W, 0.01, 0.24)), shell, hinge, (0, 0, 0.12), bevel=0.006)
    new_obj('LaptopBezel', box((W - 0.012, 0.002, 0.228)), mat('ink', 0.3), hinge, (0, -0.0055, 0.12))
    new_obj('Screen', plane(0.32, 0.2), mat('night', 0.3, 0, 'night', 0.0), hinge,
                  (0, -0.0072, 0.125), (math.radians(90), 0, 0), smooth=False)
    return r


def build_lamp():
    r = root('lamp')
    body = mat('sage', 0.55, 0.1)
    new_obj('LampBase', cyl(0.085, 0.075, 0.03), body, r, (0, 0, 0.015), bevel=0.008)
    new_obj('LampJointLow', sphere(0.018), mat('honey', 0.35, 0.5), r, (0, 0, 0.04))
    # Lower arm leans back-left, upper arm reaches forward-left over the desk.
    low = (0.0, 0.0, 0.04)
    elbow = (0.03, 0.03, 0.30)
    head = (-0.13, 0.0, 0.42)

    def arm(name, a, b):
        a, b = Vector(a), Vector(b)
        d = b - a
        ob = new_obj(name, cyl(0.009, 0.009, d.length, 16), body, r, (a + b) / 2)
        ob.rotation_mode = 'QUATERNION'
        ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
        return ob

    arm('LampArmLow', low, elbow)
    new_obj('LampJointMid', sphere(0.016), mat('honey', 0.35, 0.5), r, elbow)
    arm('LampArmHigh', elbow, head)
    new_obj('LampJointHead', sphere(0.015), mat('honey', 0.35, 0.5), r, head)
    tilt = (0, math.radians(38), 0)
    cone = cyl(0.085, 0.032, 0.12, 40, caps=False)
    bmesh.ops.solidify(cone, geom=cone.faces, thickness=0.004)
    new_obj('Shade', cone, mat('sage', 0.6, 0.05), r, (head[0] - 0.02, 0, head[2] - 0.045), tilt, bevel=0.0015, segments=2)
    new_obj('Bulb', sphere(0.026), mat('paper', 0.3, 0, 'honey', 6.0), r, (head[0] - 0.045, 0, head[2] - 0.075))
    return r


def build_vinyl():
    r = root('vinyl')
    new_obj('VinylPlinth', box((0.42, 0.32, 0.06)), mat('oak_deep', 0.55), r, (0, 0, 0.035), bevel=0.012)
    new_obj('VinylTopPlate', box((0.405, 0.305, 0.004)), mat('paper', 0.75), r, (0, 0, 0.066), bevel=0.004)
    for sx in (-1, 1):
        for sy in (-1, 1):
            new_obj('VinylFoot', cyl(0.018, 0.016, 0.01, 20), mat('ink', 0.6), r, (sx * 0.17, sy * 0.12, 0.005), bevel=0.003)
    platter = new_obj('Platter', cyl(0.135, 0.135, 0.012), mat('graphite', 0.35, 0.5), r, (-0.05, 0.0, 0.074), bevel=0.003)
    new_obj('Wax', cyl(0.13, 0.13, 0.004, 64), mat('ink', 0.28), platter, (0, 0, 0.008), bevel=0.0015, segments=2)
    new_obj('Hub', cyl(0.042, 0.042, 0.0015, 40), mat('clay', 0.6), platter, (0, 0, 0.0108))
    new_obj('HubDot', cyl(0.008, 0.008, 0.0015, 16), mat('honey', 0.5), platter, (0.024, 0, 0.0115))
    new_obj('Spindle', cyl(0.004, 0.004, 0.012, 12), mat('paper', 0.3, 0.6), platter, (0, 0, 0.014))
    new_obj('TonearmBase', cyl(0.022, 0.02, 0.022, 24), mat('graphite', 0.4, 0.5), r, (0.15, 0.1, 0.079), bevel=0.003)
    new_obj('Tonearm', cyl(0.0045, 0.0045, 0.2, 12), mat('paper', 0.3, 0.6), r,
                  (0.095, 0.02, 0.098), (math.radians(90), 0, math.radians(-35)))
    new_obj('Headshell', box((0.018, 0.034, 0.008)), mat('ink', 0.4), r, (0.038, -0.06, 0.094), (0, 0, math.radians(-35)), bevel=0.002)
    for i, x in enumerate((0.13, 0.17)):
        new_obj('VinylKnob', cyl(0.012, 0.011, 0.014, 24), mat('honey' if i else 'paper', 0.4, 0.3), r, (x, -0.11, 0.075), bevel=0.002)
    return r


def build_sketchbook():
    r = root('sketchbook')
    new_obj('SketchCover', box((0.46, 0.3, 0.006)), mat('sage_deep', 0.75), r, (0, 0, 0.003), bevel=0.003)
    for side in (-1, 1):
        new_obj('SketchPages', box((0.215, 0.28, 0.008)), mat('paper', 0.85), r,
                (side * 0.112, 0, 0.011), (0, math.radians(-3 * side), 0), bevel=0.002, segments=2)
    new_obj('PageLeft', plane(0.2, 0.265), mat('paper', 0.85), r, (-0.112, 0, 0.0158), (0, math.radians(3), 0), smooth=False)
    for i in range(9):
        new_obj('SketchRing', torus(0.011, 0.0016, segs=24, tube=8), mat('graphite', 0.3, 0.7), r,
                (0, -0.12 + i * 0.03, 0.016), (math.radians(90), 0, 0), smooth=True)
    pencil = empty('Pencil', r, (0.16, -0.09, 0.022), (0, math.radians(90), math.radians(28)))
    new_obj('PencilBody', cyl(0.0055, 0.0055, 0.15, 6), mat('honey', 0.55), pencil, (0, 0, 0), smooth=False)
    new_obj('PencilTip', cyl(0.0055, 0.0012, 0.02, 6), mat('paper', 0.7), pencil, (0, 0, 0.085), smooth=False)
    new_obj('PencilEraser', cyl(0.0058, 0.0058, 0.014, 12), mat('clay', 0.8), pencil, (0, 0, -0.082), bevel=0.0015)
    return r


def build_journal():
    r = root('journal')
    cover = mat('clay', 0.7)
    W, D, H = 0.21, 0.28, 0.038
    new_obj('JournalBack', box((W, D, 0.005)), cover, r, (0, 0, 0.0025), bevel=0.002)
    new_obj('JournalFront', box((W, D, 0.005)), cover, r, (0, 0, H - 0.0025), bevel=0.002)
    new_obj('JournalSpine', box((0.012, D, H)), cover, r, (-W / 2 + 0.004, 0, H / 2), bevel=0.005)
    new_obj('JournalPages', box((W - 0.012, D - 0.01, H - 0.01)), mat('paper', 0.9), r, (0.002, 0, H / 2), bevel=0.002)
    new_obj('JournalBand', box((0.008, D + 0.004, H + 0.004)), mat('ink', 0.6), r, (W / 2 - 0.03, 0, H / 2), bevel=0.002)
    new_obj('JournalLabel', box((0.09, 0.05, 0.0015)), mat('paper', 0.8), r, (-0.012, 0.05, H + 0.0008), bevel=0.001)
    new_obj('JournalRibbon', box((0.008, 0.05, 0.0012)), mat('honey', 0.5), r, (0.03, -D / 2 - 0.02, 0.006), (math.radians(-6), 0, math.radians(8)))
    return r


def build_teacup():
    r = root('teacup')
    glaze = mat('paper', 0.32)
    new_obj('Saucer', lathe([(0, 0), (0.07, 0), (0.1, 0.008), (0.104, 0.012), (0.098, 0.012), (0.068, 0.006), (0, 0.006)]), glaze, r, (0, 0, 0.006))
    new_obj('Cup', lathe([(0, 0), (0.045, 0), (0.058, 0.03), (0.066, 0.075), (0.068, 0.09),
                          (0.062, 0.09), (0.06, 0.076), (0.052, 0.032), (0.04, 0.008), (0, 0.008)]),
            mat('sage', 0.32), r, (0, 0, 0.051))
    new_obj('Tea', cyl(0.058, 0.058, 0.002, 40), mat('tea', 0.12), r, (0, 0, 0.08))
    new_obj('CupHandle', torus(0.024, 0.006, math.pi, 20, 10), mat('sage', 0.32), r, (0.078, 0, 0.055), (math.radians(90), math.radians(90), 0))
    return r


def build_books():
    r = root('books')
    specs = [((0.17, 0.23, 0.032), 'slate', 0.0), ((0.16, 0.22, 0.026), 'sage_deep', 0.12), ((0.15, 0.21, 0.03), 'honey', -0.08)]
    z = 0
    for i, (size, color, rot) in enumerate(specs):
        w, d, h = size
        g = empty(f'Book{i}', r, (0, 0, z + h / 2), (0, 0, rot))
        new_obj('BookCover', box(size), mat(color, 0.7), g, (0, 0, 0), bevel=0.003)
        new_obj('BookPages', box((w - 0.012, d - 0.008, h - 0.006)), mat('paper', 0.9), g, (0.008, 0, 0), bevel=0.001)
        z += h
    return r


def build_plant():
    r = root('plant')
    new_obj('Pot', lathe([(0, 0), (0.055, 0), (0.07, 0.11), (0.078, 0.115), (0.078, 0.128), (0.066, 0.128),
                          (0.06, 0.12), (0, 0.12)]), mat('clay', 0.8), r, (0, 0, 0.064))
    new_obj('Soil', cyl(0.06, 0.06, 0.004, 32), mat('ink', 0.95), r, (0, 0, 0.118))
    import random
    rnd = random.Random(7)
    for i in range(17):
        yaw = i * 2.4 + rnd.uniform(-0.2, 0.2)
        lean = math.radians(rnd.uniform(8, 55))
        length = rnd.uniform(0.13, 0.22)
        pivot = empty('Stem', r, (0, 0, 0.12), (0, lean, yaw))
        new_obj('Leaf', sphere(1, (0.04, 0.007, length / 2), 18, 10),
                mat('sage' if i % 3 else 'sage_deep', 0.6), pivot, (0, 0, length / 2 + 0.02))
    return r


def build_pencup():
    r = root('pencup')
    new_obj('PenCup', lathe([(0, 0), (0.04, 0), (0.044, 0.09), (0.04, 0.09), (0.036, 0.006), (0, 0.006)]),
            mat('slate', 0.5), r, (0, 0, 0.045))
    for i, c in enumerate(('ink', 'honey', 'clay')):
        new_obj('Pen', cyl(0.005, 0.005, 0.14, 12), mat(c, 0.45), r,
                ((i - 1) * 0.016, 0.006 * (i % 2), 0.1), (math.radians(4 * (i - 1)), math.radians(-7 * (i - 1)), 0), bevel=0.0015)
    return r


def build_keyboard():
    r = root('keyboard')
    new_obj('KeyboardBase', box((0.32, 0.11, 0.014)), mat('graphite', 0.5, 0.2), r, (0, 0, 0.007), bevel=0.005)
    keys = merge(*[
        box((0.019, 0.019, 0.006), (-0.1375 + c * 0.0228, -0.036 + row * 0.0235, 0))
        for row in range(4) for c in range(13)
    ])
    new_obj('KeyboardKeys', keys, mat('paper', 0.6), r, (0, 0.004, 0.017), bevel=0.0025, segments=2)
    new_obj('KeyboardEnter', box((0.03, 0.019, 0.006)), mat('honey', 0.5), r, (0.138, 0.0105, 0.0175), bevel=0.0025, segments=2)
    return r


BUILDERS = {
    'desk': build_desk,
    'laptop': build_laptop,
    'lamp': build_lamp,
    'vinyl': build_vinyl,
    'sketchbook': build_sketchbook,
    'journal': build_journal,
    'teacup': build_teacup,
    'books': build_books,
    'plant': build_plant,
    'pencup': build_pencup,
    'keyboard': build_keyboard,
}

# three.js LAYOUT poses (x, y, z, rotY) converted to Blender for the preview.
PREVIEW_POSES = {
    'desk': (0, 0, -0.675, 0),
    'vinyl': (-0.4, 0.44, -0.55, 0.12),
    'journal': (-0.05, 0.44, -0.28, 0.12),
    'sketchbook': (0.28, 0.44, -0.22, 0.02),
    'laptop': (0.72, 0.44, -0.38, -0.18),
    'lamp': (1.15, 0.44, -0.55, -0.18),
    'teacup': (0.48, 0.44, -0.55, -0.08),
    'books': (-0.85, 0.44, -0.35, 0.22),
    'plant': (-1.15, 0.44, -0.65, 0.3),
    'pencup': (0.48, 0.44, -0.28, 0.08),
    'keyboard': (0.72, 0.44, -0.08, -0.18),
}


def descendants(ob):
    out = [ob]
    for c in ob.children:
        out += descendants(c)
    return out


def export(root_ob):
    bpy.ops.object.select_all(action='DESELECT')
    for o in descendants(root_ob):
        o.select_set(True)
    path = os.path.join(OUT, f'{root_ob.name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                              export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    print('exported', path)


def preview(roots):
    scene = bpy.context.scene
    for name, ob in roots.items():
        x, y, z, ry = PREVIEW_POSES[name]
        ob.location = (x, -z, y)
        ob.rotation_euler = (0, 0, ry)
    new_obj('Wall', box((10, 0.05, 5)), mat('slate', 0.9), None, (0, 1.225, 2.5))
    new_obj('Floor', box((10, 10, 0.02)), mat('night', 0.95), None, (0, 0, -0.01))
    cam_data = bpy.data.cameras.new('cam')
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.angle_y = math.radians(50)
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0, -1.3, 0.95)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 2.5
    sun.data.color = (0.82, 0.88, 1.0)
    sun.rotation_euler = (math.radians(50), math.radians(-30), math.radians(-20))
    scene.collection.objects.link(sun)
    spot = bpy.data.objects.new('lampspot', bpy.data.lights.new('lampspot', 'POINT'))
    spot.data.energy = 25
    spot.data.color = (1.0, 0.62, 0.3)
    spot.location = (1.0, 0.55, 0.8)
    scene.collection.objects.link(spot)
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.06, 0.09, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.2
    scene.world = world
    for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.view_settings.view_transform = 'AgX'
    scene.render.filepath = os.path.join(ROOT, 'tools', 'blender', 'preview.png')
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(OUT, exist_ok=True)
    roots = {name: build() for name, build in BUILDERS.items()}
    for ob in roots.values():
        export(ob)
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--preview' in argv:
        preview(roots)


main()
