/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {number} totalWidth 
 * @param {string} texture 
 * @param {number} scrollFactor 
 */
 export function createAligned(scene, totalWidth, texture, scrollFactor) {
	const w = scene.textures.get(texture).getSourceImage().width
	const count = Math.ceil(totalWidth / w) * scrollFactor

	let x = 0
	for (let i = 0; i < count; ++i)
	{
		const m = scene.add.image(x, scene.scale.height, texture)
			.setOrigin(0, 1)
			.setScrollFactor(scrollFactor)

		x += m.width
	}
}  

export function setupBackground(scene) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const totalWidth = width * 10;

    scene.add.image(width * 0.5, height * 0.5, 'bg1')
        .setScrollFactor(0);

    //createAligned(scene, totalWidth, 'bg1', 0.0);
    //createAligned(scene, totalWidth, 'bg2', 0.25);
    //createAligned(scene, totalWidth, 'bg2', 0.5);
}

export function setupViewport(game) {
    var canvas = game.canvas, width = window.innerWidth, height = window.innerHeight;
    var wratio = width / height, ratio = canvas.width / canvas.height;
    if (wratio < ratio) {
        canvas.style.width = width + "px";
        canvas.style.height = (width / ratio) + "px";
    } else {
        canvas.style.width = (height * ratio) + "px";
        canvas.style.height = height + "px";
    }
}

export function randomChoose(choose_array) {
	return choose_array[Math.floor(Math.random() * choose_array.length)];
}