const { Color, Rectangle, Text } = require("scenegraph");
const commands = require("commands");
const clipboard = require("clipboard");
const {
  error
} = require("./node_modules/@adobe/xd-plugin-toolkit/lib/dialogs.js");
const { Parser } = require("./node_modules/json2csv/dist/json2csv.umd.js");

const NUMBERED_GROUP_NAME = "__NUMBERED__";
const LABEL_WIDTH = 40;
const LABEL_HEIGHT = 24;
const LABEL_FILL_COLOR = new Color("Red");
const LABEL_OPACITY = 0.7;
const LABEL_FONT_FAMILY = "Arial";
const LABEL_FONT_SIZE = 18;
const LABEL_FONT_STYLE = "Bold";
const LABEL_TEXT_COLOR = new Color("White");
const LABEL_OFFSET_X = 0;
const LABEL_OFFSET_Y = -10;

function createLabel(selection, node, textContent) {
  const rect = new Rectangle();
  rect.width = LABEL_WIDTH;
  rect.height = LABEL_HEIGHT;
  rect.fill = LABEL_FILL_COLOR;
  rect.opacity = LABEL_OPACITY;
  selection.insertionParent.addChild(rect);

  const text = new Text();
  text.text = textContent;
  text.fontFamily = LABEL_FONT_FAMILY;
  text.fontSize = LABEL_FONT_SIZE;
  text.fontStyle = LABEL_FONT_STYLE;
  text.fill = LABEL_TEXT_COLOR;
  text.textAlign = Text.ALIGN_CENTER;
  selection.insertionParent.addChild(text);

  selection.items = [rect, text];
  commands.alignVerticalCenter();
  commands.alignHorizontalCenter();
  commands.group();
  const label = selection.items[0];
  const bounds = node.globalBounds;
  const parentBounds = selection.insertionParent.globalBounds;
  const deltaX = bounds.x - parentBounds.x + LABEL_OFFSET_X;
  const deltaY = bounds.y - parentBounds.y + LABEL_OFFSET_Y;
  label.moveInParentCoordinates(deltaX, deltaY);

  return label;
}

function findTextNode(node, ignore) {
  const ignoreList = Array.isArray(ignore) ? ignore : [];
  let buff = [];
  node.children.forEach(n => {
    if (n instanceof Text) {
      const hasNotIgnore = ignoreList.some((item) => {
        return !(new RegExp(item)).test(n.text);
      });
      if (hasNotIgnore) {
        buff.push(n);
      }
    } else if (n.name !== NUMBERED_GROUP_NAME) {
      buff = [...buff, ...findTextNode(n, ignore)];
    }
  });

  return buff;
}

function sortByCoordinates(nodeArray) {
  return nodeArray.sort((a, b) => {
    const ax = a.globalBounds.x;
    const ay = a.globalBounds.y;
    const bx = b.globalBounds.x;
    const by = b.globalBounds.y;
    const p = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2) * 10000);
    const q = Math.sqrt(Math.pow(bx, 2) + Math.pow(by, 2) * 10000);

    return p - q;
  });
}

async function main(selection) {
  const ignoreList = [
    "/",
    ">",
  ];
  const currentSelectionItems = selection.items;
  if (currentSelectionItems.length === 0) {
    await error(
      "Error",
      "No selected items. Please select an artboard and run."
    );

    return;
  }
  const rootNode = selection.insertionParent;
  const textNodeArray = sortByCoordinates(findTextNode(rootNode, ignoreList));
  const labels = textNodeArray.map((textNode, index) => {
    return createLabel(selection, textNode, `${index + 1}`);
  });

  selection.items = labels;
  commands.group();
  const group = selection.items[0];
  group.name = NUMBERED_GROUP_NAME;

  selection.items = currentSelectionItems;

  const data = textNodeArray.map((textNode, index) => {
    return { id: `${index + 1}`, text: textNode.text };
  });
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);
  clipboard.copyText(csv);
}

module.exports = {
  commands: {
    main: main
  }
};
