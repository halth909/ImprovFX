const audioCancelDuration = 1000;

const audio = (_ => {
    let player = null;
    let cancelTimeoutId = null;

    let _public = {};

    _public.play = src => {
        if (player) {
            player.stop();
        }

        if (cancelTimeoutId) {
            clearTimeout(cancelTimeoutId);
        }

        player = new Howl({ src });
        player.play();
    }

    _public.cancel = _ => {
        console.log(player);
        if (!player) {
            return;
        }

        player.fade(1, 0, audioCancelDuration);

        cancelTimeoutId = setTimeout(_ => {
            if (player) {
                player.stop();
            }
        }, 5000);
    }

    return _public;
})();

const details = (_ => {
    let _public = {};

    _public.update = _ => {
        let result = {};

        $('input, textarea').each((index, element) => {
            result[$(element).attr('id')] = $(element).val();
        });

        api.sendMessage('detailsUpdated', JSON.stringify(result));
    }

    _public.add = ({ key, index } = {}) => {
        if (typeof key === 'undefined') {
            key = `custom-${index}`;
        }

        if (typeof index === 'undefined') {
            index = parseInt(key.substring(7));
        }

        $('#add-markdown').before($.parseHTML(`
            <div class="markdown-container custom-markdown">
                <div class="markdown-header">
                    <label for="${key}">Custom Text</label>
                    <button class="remove-markdown">Remove</button>
                    <button class="markdown-show">Show</button>
                </div>
                <textarea id="${key}" rows="4" placeholder="Custom markdown"></textarea>
            </div>
        `));
    }

    return _public;
})();

function hidePanels() {
    $('.panel-full').hide();
    $('.header-tab').removeClass('selected');
}

async function init() {
    $(document).on('click', '.header-tab', event => {
        hidePanels();

        const $target = $(event.target);
        $(`#panel-${$target.attr ('data-panel')}`).show();
        $target.addClass('selected');
    });

    $(document).on('click', '.clear', event => {
        const type = $(event.target).attr('data-type');

        api.sendMessage('clear', type);
        audio.cancel();
    });

    $(document).on('click', '#clear-sfx', _ => {
        console.log('clearing sfx');
        audio.cancel();
    });

    // local interaction
    $(document).on('click', '.video-button', event => {
        api.sendMessage('playVideo', $(event.currentTarget).attr('data-url'));
    });

    $(document).on('click', '.markdown-show', event => {
        let siblings = $(event.target).parent().siblings();
        siblings.each((index, sibling) => {
            api.sendMessage('showText', $(sibling).val());
        });
    });

    $(document).on('click', '#add-markdown', _ => {
        let index = $('.custom-markdown').length;

        details.add({ index });
    });

    $(document).on('click', '.remove-markdown', event => {
        $(event.target).closest('.markdown-container').remove();
    });

    $(document).on('click', '.image-button', event => {
        console.log('image clicked');
        api.sendMessage('imageClicked', $(event.currentTarget).attr('data-url'));
    });

    $(document).on('click', '.sfx-button', event => {
        const src = $(event.currentTarget).attr('data-url');
        audio.play(src);
    });

    $(document).on('keydown', event => {
        const num = parseInt(event.key);

        if (isNaN(num)) {
            return;
        }

        if (num > $('.sfx-button').length) {
            return;
        }

        new Howl({
            src: [$('.sfx-button').eq(num - 1).attr('data-url')]
        }).play();
    });

    $(document).on('keyup', 'input, textarea', _ => {
        details.update();
    });

    // api events
    api.onListFiles((files) => {
        for (let i = 0; i < files.videos.length; i++) {
            const video = files.videos[i];
            console.log(video);

            $('#video-buttons').append($.parseHTML(`
                <div class="video-button media-button" data-url="${video.url}">
                    <video class="media-preview" src="${video.url}#t=5"></video>
                    <p>${video.name}</p>
                </div>
            `));
        }

        for (let i = 0; i < files.images.length; i++) {
            const image = files.images[i];

            $('#image-buttons').append($.parseHTML(`
                <div class="image-button media-button" data-url="${image.url}">
                    <img class="media-preview" src="${image.url}">
                    <p>${image.name}</p>
                </div>
            `));
        }

        for (let i = 0; i < files.sfx.length; i++) {
            const sfx = files.sfx[i];
            const keymarker = i < 9 ? `(${i + 1}) ` : '';

            $('#sfx-buttons').append($.parseHTML(`
                <button class="sfx-button" data-url="${sfx.url}">
                    <img class="play-icon" src="./assets/play.png">
                    <p>${keymarker}${sfx.name}</p>
                </button>
            `));
        }
    });

    api.onLoadPreviousText((previousText) => {
        console.log(previousText);

        previousText = JSON.parse(previousText);

        for (const [key, value] of Object.entries(previousText)) {
            let $elements = $(`#${key}`);

            if ($elements.length === 0) {
                details.add({ key });
            }

            $(`#${key}`).val(value);
        }
    });

    // request media files
    api.sendMessage('getFiles');
    document.getElementsByClassName('header-tab')[0].click();
}

window.onload = _ => {
    init();
}