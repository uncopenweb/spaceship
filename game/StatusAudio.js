/**
 * Status event announcer for the Spaceship! game status model.
 *
 * Copyright (c) 2008, 2009 Peter Parente under the terms of the BSD license.
 * http://creativecommons.org/licenses/BSD/
 */
dojo.provide('spaceship.game.StatusAudio');
dojo.require('dijit._Widget');
dojo.require('spaceship.game.GameTopics');
dojo.require('spaceship.utils.Subscriber');
dojo.require('spaceship.sounds.AudioManager');

dojo.declare('spaceship.game.StatusAudio', [dijit._Widget,
                                            spaceship.utils.Subscriber], {
    // status model
    model: null,
    // bundle of config
    config: null,
    // audio manager
    audio: spaceship.sounds.AudioManager,
    postMixInProperties: function() {
        this._barrier = null;
        this._transition = false;
    },

    postCreate: function() {
        this.subscribe(spaceship.game.END_MINIGAME_SERIES_TOPIC, 'onTransition');
        this.subscribe(spaceship.game.START_MINIGAME_SERIES_TOPIC, 'onTransition');
        this.subscribe(spaceship.game.SHOW_STATUS_TOPIC, 'onSayMessage');
        this.subscribe(spaceship.game.END_GAME_TOPIC, 'onEndGame');
    },
    
    uninitialize: function() {
        this.unsubscribeAll();
    },
    
    onEndGame: function() {
        this.destroyRecursive();
    },
    
    onTransition: function() {
        this._transition = true;
    },
    
    onSayMessage: function(bar, topic, value) {
        var msgs;
        if(topic == spaceship.game.PREPARE_SHOT_TOPIC) {
            msgs = this.model.getShotMessage(value);
        } else if(topic == spaceship.game.PLAY_MINIGAME_TOPIC) {
            msgs = this.model.getMinigameMessage(value);
        } else if(topic == spaceship.game.WIN_GAME_TOPIC) {
            msgs = this.model.getWinMessage();
        } else if(topic == spaceship.game.LOSE_GAME_TOPIC) {
            msgs = this.model.getLoseMessage();
        } else {
            msgs = this.model.getLastActionMessage();
        }
        // filter out empty messages
        msgs = dojo.filter(msgs, function(msg) {
            return !!msg;
        });
        // stop current speech
        this.audio.stop(spaceship.sounds.SPEECH_CHANNEL);
        // count messages, including the transition sound
        var count = 0;
        // register observer
        var token = this.audio.addObserver(dojo.hitch(this, function(audio, event) {
            if(event.name != 'status') return;
            ++count;
            if (count == msgs.length) {
                audio.removeObserver(token);
                this.onMessageDone();
            }
        }), spaceship.sounds.SPEECH_CHANNEL, ['finished-say']);
        // speak messages
        for(var i=0; i < msgs.length; i++) {
            if(this._transition && i == msgs.length-1) {
                // play the transition sound before the challenge or shot
                // announcement
                this.audio.play(spaceship.sounds.TRANSITION_SOUND,
                    spaceship.sounds.SPEECH_CHANNEL, 'status');
            }
            this.audio.say(msgs[i], spaceship.sounds.SPEECH_CHANNEL, 'status');
        }
        // reset transition
        this._transition = false;
        // add this as responder to barrier and store it
        bar.addResponder(this.id);
        this._barrier = bar;
    },

    onMessageDone: function() {
        // reset the instance barrier so we're reentrant
        var bar = this._barrier;
        this._barrier = null;
        // notify the barrier
        bar.notify(this.id);
    }
});