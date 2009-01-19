/**
 * Status event viewer for the Spaceship! game status model.
 *
 * Copyright (c) 2008 Peter Parente under the terms of the BSD license.
 * http://creativecommons.org/licenses/BSD/
 */
dojo.provide('spaceship.game.StatusView');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dijit._Container');
dojo.require('spaceship.game.GameTopics');
dojo.require('spaceship.utils.Subscriber');

dojo.declare('spaceship.game.StatusView', [dijit._Widget, 
                                           dijit._Templated, 
                                           dijit._Contained,
                                           spaceship.utils.Subscriber], {
    // status model
    model: null,
    // path to template file
    templatePath: dojo.moduleUrl('spaceship', 'templates/StatusView.html'),
    postMixInProperties: function() {
        // barrier to notify on message done
        this._barrier = null;
    },
    
    postCreate: function() {
        // start listening for requests to show messages
        this.subscribe(spaceship.game.SHOW_STATUS_TOPIC, 'onShowMessage');
        this.subscribe(spaceship.game.END_GAME_TOPIC, 'onEndGame');
    },
    
    resize: function(size) {
        dojo.marginBox(this.domNode, size);
    },
    
    onEndGame: function() {
        this.unsubscribeAll();
        var parent = this.getParent();
        parent.removeChild(this);
        this.destroyRecursive();
    },
     
    onShowMessage: function(bar, topic, value) {
        var msgs;
        if(topic == spaceship.game.PREPARE_SHOT_TOPIC) {
            msgs = this.model.getShotMessage(value);
        } else if(topic == spaceship.game.PLAY_MINIGAME_TOPIC) {
            msgs = this.model.getMinigameMessage(value);
        }
        // insert the message text
        this._changeMessageNode.textContent = msgs[0];
        this._statusMessageNode.textContent = msgs[1];
        this._nextMessageNode.textContent = msgs[2];
        // show the message pane in its container
        var parent = this.getParent();
        parent.selectChild(this);
        // add this as responder to barrier and store it
        bar.addResponder(this.id);
        this._barrier = bar;
        // wait at least a little while for the player
        setTimeout(dojo.hitch(this, this.onMessageDone), 2000);
    },
    
    onMessageDone: function() {
        // reset the instance barrier so we're reentrant
        var bar = this._barrier;
        this._barrier = null;
        // notify the barrier
        bar.notify(this.id);
    }
});