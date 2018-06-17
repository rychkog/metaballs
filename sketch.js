const CELL_WIDTH = 5;
const CELL_WIDTH_HALF = CELL_WIDTH / 2;
const CANVAS_WIDTH = 1000;
const CANVAS_MARGIN = 0;
const CIRCLE_HALF_RADIUS = 30;
const CIRCLE_RADIUS_SQUARED = Math.pow(CIRCLE_HALF_RADIUS * 2, 2);

const cells = [];
const circles = [];

const NW_MASK = 0b1000;
const NE_MASK = 0b0100;
const SE_MASK = 0b0010;
const SW_MASK = 0b0001;

function toSamplePattern(a, b, c, d) {
  let result = a ? 0 | NW_MASK : 0;
  result = b ? result | NE_MASK : result;
  result = c ? result | SE_MASK : result;
  return d ? result | SW_MASK : result;
}

function setup() {
  createCanvas(CANVAS_WIDTH + CANVAS_MARGIN + 1, CANVAS_WIDTH + CANVAS_MARGIN + 1);

  for (let y = CANVAS_MARGIN; y < CANVAS_WIDTH; y += CELL_WIDTH) {
    for (let x = CANVAS_MARGIN; x < CANVAS_WIDTH; x += CELL_WIDTH) {
      cells.push({ x, y, cX: x + CELL_WIDTH / 2, cY: y + CELL_WIDTH / 2 });
    }
  }

  for (let circle = 0; circle < 20; circle++) {
    circles.push({ pos: createVector(200, 200), radius: CIRCLE_HALF_RADIUS * 2, vel: p5.Vector.random2D().mult(1, 2) });
  }
}

function draw() {
  clear();
  stroke(255, 0, 0);

  for (const cell of cells) {
    const { a, b, c, d } = getLinearSample(cell);

    if (a) {
      line(a.x, a.y, b.x, b.y);
    }

    if (c) {
      line(c.x, c.y, d.x, d.y);
    }
  }

  stroke(0);
  fill(255);

  for (const circle of circles) {
    circle.pos.add(circle.vel);

    if (circle.pos.x > CANVAS_WIDTH - CIRCLE_HALF_RADIUS || circle.pos.x < CIRCLE_HALF_RADIUS) {
      circle.vel.x *= -1;
    }

    if (circle.pos.y > CANVAS_WIDTH - CIRCLE_HALF_RADIUS || circle.pos.y < CIRCLE_HALF_RADIUS) {
      circle.vel.y *= -1;
    }

    ellipse(circle.pos.x, circle.pos.y, circle.radius, circle.radius);
  }
}

function circlesContributionsAtPoints(a, b, c, d) {
  // This function looks ugly because of performance reasons

  let aContribs = 0;
  let bContribs = 0;
  let cContribs = 0;
  let dContribs = 0;

  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];

    if (a) {
      const xCircleDist = a.x - circle.pos.x;
      const yCircleDist = a.y - circle.pos.y;
      aContribs += CIRCLE_RADIUS_SQUARED / (xCircleDist * xCircleDist + yCircleDist * yCircleDist);
    }

    if (b) {
      const xCircleDist = b.x - circle.pos.x;
      const yCircleDist = b.y - circle.pos.y;
      bContribs += CIRCLE_RADIUS_SQUARED / (xCircleDist * xCircleDist + yCircleDist * yCircleDist);
    }

    if (c) {
      const xCircleDist = c.x - circle.pos.x;
      const yCircleDist = c.y - circle.pos.y;
      cContribs += CIRCLE_RADIUS_SQUARED / (xCircleDist * xCircleDist + yCircleDist * yCircleDist);
    }

    if (d) {
      const xCircleDist = d.x - circle.pos.x;
      const yCircleDist = d.y - circle.pos.y;
      dContribs += CIRCLE_RADIUS_SQUARED / (xCircleDist * xCircleDist + yCircleDist * yCircleDist);
    }
  }

  return {
    a: aContribs,
    b: bContribs,
    c: cContribs,
    d: dContribs
  };
}

function getLinearSample(cell) {
  const sw = { x: cell.x, y: cell.y + CELL_WIDTH };
  const se = { x: cell.x + CELL_WIDTH, y: cell.y + CELL_WIDTH };
  const nw = { x: cell.x, y: cell.y };
  const ne = { x: cell.x + CELL_WIDTH, y: cell.y };

  const { a: swContribs, b: seContribs, c: nwContribs, d: neContribs } = circlesContributionsAtPoints(sw, se, nw, ne);

  const pattern = toSamplePattern(
    nwContribs >= 1,
    neContribs >= 1,
    seContribs >= 1,
    swContribs >= 1
  );

  switch (pattern) {
    case 0b0000: {
      return {};
    }
    case 0b0001: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(sw, se);
      return { a, b };
    }
    case 0b0010: {
      const a = interpolatePoint(ne, se);
      const b = interpolatePoint(sw, se);
      return { a, b };
    }
    case 0b0011: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(ne, se);
      return { a, b };
    }
    case 0b0100: {
      const a = interpolatePoint(nw, ne);
      const b = interpolatePoint(ne, se);
      return { a, b };
    }
    case 0b0101: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(nw, ne);
      const c = interpolatePoint(sw, se);
      const d = interpolatePoint(ne, se);

      return { a, b, c, d };
    }
    case 0b0110: {
      const a = interpolatePoint(nw, ne);
      const b = interpolatePoint(sw, se);
      return { a, b };
    }
    case 0b0111: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(nw, ne);
      return { a, b };
    }
    case 0b1000: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(nw, ne);
      return { a, b };
    }
    case 0b1001: {
      const a = interpolatePoint(nw, ne);
      const b = interpolatePoint(sw, se);
      return { a, b };
    }
    case 0b1010: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(sw, se);
      const c = interpolatePoint(nw, ne);
      const d = interpolatePoint(ne, se);

      return { a, b, c, d };
    }
    case 0b1011: {
      const a = interpolatePoint(nw, ne);
      const b = interpolatePoint(ne, se);
      return { a, b };
    }
    case 0b1100: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(ne, se);
      return { a, b };
    }
    case 0b1101: {
      const a = interpolatePoint(sw, se);
      const b = interpolatePoint(ne, se);
      return { a, b };
    }
    case 0b1110: {
      const a = interpolatePoint(nw, sw);
      const b = interpolatePoint(sw, se);
      return { a, b };
    }
    case 0b1111: {
      return {};
    }
  }
}

function interpolatePoint(cornerA, cornerB) {
  const { a: contribsAtA, b: contribsAtB } = circlesContributionsAtPoints(cornerA, cornerB);

  const coords = {
    x: cornerA.x,
    y: cornerA.y + (cornerB.y - cornerA.y) * ((1 - contribsAtA) / (contribsAtB - contribsAtA))
  };

  return coords;
}
