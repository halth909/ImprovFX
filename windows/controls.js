const details = (_ => {
    let _public = {};

    _public.update = _ => {
        let result = {};

        $('input, textarea').each((index, element) => {
            result[$(element).attr('id')] = $(element).val();
        });

        api.sendMessage('detailsUpdated', JSON.stringify(result));
    }

    return _public;
})();

async function init() {
    $('#panel-details').hide();

    $(document).on('click', '#button-controls', _ => {
        $('#panel-controls').show();
        $('#panel-details').hide();
    });

    $(document).on('click', '#button-details', _ => {
        $('#panel-controls').hide();
        $('#panel-details').show();
    });

    // local interaction
    $(document).on('click', '.image-button', event => {
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

    $(document).on('click', '#play-intro', _ => {
        api.sendMessage('playVideo', '_media/intro.mp4');
    });

    $(document).on('click', '#play-outro', _ => {
        api.sendMessage('playVideo', '_media/outro.mp4');
    });

    $(document).on('keyup', 'input, textarea', _ => {
        details.update();
    });

    // api events
    api.onListFiles((files) => {
        console.log(files);

        for (let i = 0; i < files.images.length; i++) {
            const image = files.images[i];
            console.log(image);

            $('#image-buttons').append($.parseHTML(`
                <div class="image-button" data-url="${image.url}">
                    <img class="image-preview" src="${image.url}">
                    <p>${image.name}</p>
                </div>
            `));
        }

        for (let i = 0; i < files.sfx.length; i++) {
            const sfx = files.sfx[i];
            console.log(sfx);

            const keymarker = i < 9 ? `(${i + 1}) ` : '';

            $('#sfx-buttons').append($.parseHTML(`
                <button class="sfx-button" data-url="${sfx.url}">
                    <img class="play-icon" src="./assets/play.png">
                    <p>${keymarker}${sfx.name}</p>
                </button>
            `));
        }
    });

    api.onUpdateDetails((details) => {
        details = JSON.parse(details);

        for (const [key, value] of Object.entries(details)) {
            $(`#${key}`).val(value);
        }
    });

    // request media files
    api.sendMessage('getFiles');
}

window.onload = _ => {
    init();
}