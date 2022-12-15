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

function fadeOut(query) {
    return new Promise(async resolve => {
        busy = true;

        $(query).addClass('hidden');

        if ($(query).length > 0) {
            await milliseconds(transitionDuration / 2);
        }

        $(query).remove();

        resolve();
    });
}

function fadeIn(query) {
    return new Promise(async resolve => {
        await animationFrame();
        await animationFrame();

        $(query).addClass('animated');
        $(query).removeClass('hidden');

        await milliseconds(transitionDuration / 2);

        busy = false;

        resolve();
    });
}

async function transitionToImage({ imagePath }) {
    console.log(imagePath);

    await fadeOut('.media-item');

    $('body').append($.parseHTML(`
        <img class="media-item hidden" src="${imagePath}">
    `));

    await fadeIn('.media-item');

    tryProcessAction();
}

async function transitionToVideo({ videoPath }) {
    console.log(videoPath);

    await fadeOut('.media-item');

    $('body').append($.parseHTML(`
        <video class="media-item hidden" src="${videoPath}" autoplay>
    `));

    await fadeIn('.media-item');

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

    api.onUpdateDetails((details) => {
        details = JSON.parse(details);

        for (const [key, value] of Object.entries(details)) {
            $(`#${key}`).html(value);
        }
    });

    api.sendMessage('getConfig');
}

window.onload = _ => {
    init();
}