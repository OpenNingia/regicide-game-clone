export default class CastleZone {
    constructor(scene) {
        this.renderZone = () => {
            let dropZone = scene.add.zone(1000, 300, 300, 250).setRectangleDropZone(300, 250);
            dropZone.setData({ objects: [] });
            return dropZone;
        };
        this.renderOutline = (dropZone) => {
            let dropZoneOutline = scene.add.graphics();
            dropZoneOutline.lineStyle(4, 0xff69b4);
            dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
        }
    }
}