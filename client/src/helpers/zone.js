export default class Zone {
    constructor(scene) {
        this.renderZone = () => {
            let x = 20;
            let y = 110;
            let w = 900;
            let h = 250;

            let dropZone = scene.add.zone(x, y, w, h).setRectangleDropZone(w, h);
            dropZone.setData({ cards: [] });

            let zoneBg = scene.add.image(x, y, 'old-scroll')
                                 .setScale(0.4, 0.3).setDepth(0).setOrigin(0);
   
            return dropZone;
        };
        this.renderOutline = (dropZone) => {            	    			
            let dropZoneOutline = scene.add.graphics();
            dropZoneOutline.lineStyle(4, 0xff69b4);
            dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
        }
    }
}