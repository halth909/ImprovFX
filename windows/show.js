const milliseconds = (milliseconds) => {
    return new Promise(async(resolve) => {
        setTimeout(_ => {
            resolve();
        }, milliseconds);
    })
}

const animationFrame = _ => {
    return new Promise(async(resolve) => {
        requestAnimationFrame(_ => {
            resolve();
        });
    })
}

const transitionDuration = 5000; // milliseconds

let busy = false;
let actionBuffer = null;

function tryProcessAction() {
    if (busy) {
        return;
    }

    if (actionBuffer === null) {
        return;
    }

    actionBuffer.action(actionBuffer.options);
    actionBuffer = null;
}

function fadeOut() {
    return new Promise(async resolve => {
        busy = true;

        $('.media-item').addClass('hidden');

        if ($('.media-item').length > 0) {
            await milliseconds(transitionDuration / 2);
        }

        $('.media-item').remove();

        resolve();
    });
}

function fadeIn() {
    return new Promise(async resolve => {
        await animationFrame();
        await animationFrame();

        $('.media-item').addClass('animated');
        $('.media-item').removeClass('hidden');

        await milliseconds(transitionDuration / 2);

        busy = false;

        resolve();
    });
}

async function transitionToImage({ imagePath }) {
    console.log(imagePath);

    await fadeOut();

    $('body').append($.parseHTML(`
        <img class="media-item hidden" src="${imagePath}">
    `));

    await fadeIn();

    tryProcessAction();
}

async function transitionToVideo({ videoPath }) {
    console.log(videoPath);

    await fadeOut();

    $('body').append($.parseHTML(`
        <video class="media-item hidden" src="${videoPath}" autoplay>
    `));

    await fadeIn();

    tryProcessAction();
}

async function init() {
    api.onShowImage((imagePath) => {
        actionBuffer = {
            action: transitionToImage,
            options: { imagePath }
        };

        tryProcessAction();
    });

    api.onPlayVideo((videoPath) => {
        console.log(videoPath);

        actionBuffer = {
            action: transitionToVideo,
            options: { videoPath }
        };

        tryProcessAction();
    });
}

window.onload = _ => {
    init();
}