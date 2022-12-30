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

async function init() {
    $('#panel-controls').hide();

    $(document).on('click', '#button-controls', _ => {
        $('#panel-controls').show();
        $('#panel-details').hide();
    });

    $(document).on('click', '#button-details', _ => {
        $('#panel-controls').hide();
        $('#panel-details').show();
    });

    $(document).on('click', '#button-clear', _ => {
        console.log('clearing all');
        api.sendMessage('clear', 'all');
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
        new Howl({
            src: [$(event.currentTarget).attr('data-url')]
        }).play();
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
                    <video class="media-preview" src="${video.url}" autoplay muted loop></video>
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
}

window.onload = _ => {
    init();
}