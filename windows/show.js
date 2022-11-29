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

async function transitionToImage({ imagePath }) {
    console.log(imagePath);
    busy = true;

    $('.media-item').addClass('hidden');

    if ($('.media-item').length > 0) {
        await milliseconds(transitionDuration / 2);
    }

    $('.media-item').remove();

    $('body').append($.parseHTML(`
        <img class="media-item hidden" src="${imagePath}">
    `));

    await animationFrame();
    await animationFrame();

    $('.media-item').addClass('animated');
    $('.media-item').removeClass('hidden');

    busy = false;
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

    api.onPlayVideo((videoName) => {
        console.log(videoName);
    });
}

window.onload = _ => {
    init();
}