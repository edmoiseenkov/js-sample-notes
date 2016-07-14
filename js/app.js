
// todo: Helper do private
var Helper = {
	on: function(el, events, fn) {
		for (var i = 0; i <= events.length; i++) {
			el.addEventListener(events[i], fn, false);
		}
	}
};

var LocalStorage = {

	set: function (key, value) {
		try {
			localStorage.setItem(key, JSON.stringify({
				data: value
			}));
		} catch (e) {
			console.error('Ошибка при сохранении в localStorage', key, value);
		}
	},

	get: function (key) {
		var value;

		try {
			value = JSON.parse(localStorage.getItem(key)).data;
		} catch (e) {
			value = null;
		}

		return value;
	}
};

var NoteModel = function() {

	// private
	var data = {
		id: null,
		text: '',
		datetime: null
	};

	// public
	this.getId = function() {
		return data.id;
	};
	this.setId = function(id) {
		data.id = id;
	};

	this.getText = function() {
		return data.text;
	};
	this.setText = function(text) {
		data.text = text;
	};

	this.getDatetime = function() {
		return data.datetime;
	};
	this.setDatetime = function(datetime) {
		data.datetime = datetime;
	};
	this.getDatetimeString = function() {
		function addZero(number) {
			return (number < 10) ? '0' + number : number;
		}

		var day = data.datetime.getDate(),
			month = data.datetime.getMonth() + 1,
			year = data.datetime.getFullYear(),
			hours = data.datetime.getHours(),
			minutes = data.datetime.getMinutes(),
			seconds = data.datetime.getSeconds();

		return addZero(day) + '-' + addZero(month) + '-' + year + ' ' + addZero(hours) + ':' + addZero(minutes) + ':' + addZero(seconds);
	};

	this.toObject = function() {
		return data;
	};
};

var NotesApp = {

	els: {
		createNoteBtn: document.getElementById('createNoteBtn'),
		createNoteForm: document.getElementById('createNoteForm'),
		newNoteText: document.getElementById('newNoteText'),
		saveNoteBtn: document.getElementById('saveBtn'),
		cancelNoteBtn: document.getElementById('cancelBtn'),
		notes: document.getElementById('notes')
	},

	notes: [],

	start: function () {
		this.delegateEvents();
		this.fetchNotes();
		this.renderNotes();
	},

	delegateEvents: function() {
		var self = this;

		Helper.on(self.els.createNoteBtn, ['click'], function() {
			self.els.createNoteForm.style.display = 'block';
			self.els.createNoteBtn.style.display = 'none';
		});

		Helper.on(self.els.cancelNoteBtn, ['click'], function() {
			self.els.createNoteForm.style.display = 'none';
			self.els.createNoteBtn.style.display = 'block';

			self.els.newNoteText.value = '';
			self.els.saveNoteBtn.setAttribute('disabled', 'disabled');
		});

		Helper.on(self.els.saveNoteBtn, ['click'], function() {
			self.els.createNoteForm.style.display = 'none';
			self.els.createNoteBtn.style.display = 'block';

			self.createNote(self.els.newNoteText.value);

			self.els.newNoteText.value = '';
			self.els.saveNoteBtn.setAttribute('disabled', 'disabled');
		});

		Helper.on(self.els.newNoteText, ['keyup', 'paste'], function() {
			if (!self.els.newNoteText.value.trim()) {
				self.els.saveNoteBtn.setAttribute('disabled', 'disabled');
			} else {
				self.els.saveNoteBtn.removeAttribute('disabled');
			}
		});
	},

	fetchNotes: function() {
		this.notes = [];

		var notes = LocalStorage.get('notes') || [];

		for(var i = 0; i < notes.length; i++) {

			var note = new NoteModel();
			note.setId(notes[i].id);
			note.setText(notes[i].text);
			note.setDatetime(new Date(notes[i].datetime));

			this.notes.push(note);
		}

		return this.notes;
	},

	saveNotes: function() {
		this.notes = this.notes || [];

		var notes = [];
		for (var i = 0; i < this.notes.length; i++) {
			notes.push(this.notes[i].toObject());
		}

		LocalStorage.set('notes', notes);
	},

	createNote: function(text) {
		var note = new NoteModel();
		note.setId(new Date().getTime());
		note.setText(text);
		note.setDatetime(new Date());
		this.notes.unshift(note);
		this.saveNotes();
		this.renderNote(note);
	},

	renderNotes: function() {
		this.els.notes.innerHTML = '';

		for (var i = this.notes.length - 1; i >= 0; i--) {
			this.renderNote(this.notes[i]);
		}
	},

	renderNote: function(note) {
		var self = this,
			noteEl = document.createElement('div');

		noteEl.setAttribute('data-id', note.getId());
		noteEl.className = 'note';
		noteEl.innerHTML =
			'<a class="note-remove">' +
				'<span class="glyphicon glyphicon-remove"></span>' +
			'</a>' +
			'<p class="note-text">' + note.getText() +'</p>' +
			'<p class="text-muted text-right note-date"><small>' + note.getDatetimeString() + '</small></p>' +
			'<div class="note-remove-cancel">' +
				'<div>' +
					'Do you really want to remove this note?&nbsp;(&nbsp;<span class="timer"></span>s.)<br/><br/>' +
					'<a href="javascript: void(0);">Cancel remove</a>' +
				'</div>' +
			'</div>';


		this.els.notes.insertBefore(noteEl, this.els.notes.firstChild);

		var noteRemoveEl = noteEl.getElementsByClassName('note-remove')[0],
			noteRemoveCancelBlockEl = noteEl.getElementsByClassName('note-remove-cancel')[0],
			noteRemoveCancelTimerEl = noteRemoveCancelBlockEl.getElementsByClassName('timer')[0],
			noteRemoveCancelEl = noteRemoveCancelBlockEl.getElementsByTagName('a')[0];

		noteRemoveCancelBlockEl.style.height = noteEl.clientHeight + 'px';

		noteRemoveEl.addEventListener('click', function() {
			noteRemoveCancelBlockEl.style.display = 'table';

			noteRemoveCancelTimerEl.innerHTML = 5;

			var timerInterval = setInterval(function() {
				var timerValue = parseInt(noteRemoveCancelTimerEl.innerHTML, 10) - 1;
				noteRemoveCancelTimerEl.innerHTML = timerValue;

				if (timerValue <= 0) {
					for (var i = 0 ; i < self.notes.length; i++) {
						if (self.notes[i].getId() == noteEl.getAttribute('data-id')) {
							self.notes.splice(i, 1);
							break;
						}
					}
					self.saveNotes();

					self.els.notes.removeChild(noteEl);

					clearInterval(timerInterval);
				}
			}, 1000);

			noteRemoveCancelEl.addEventListener('click', function () {
				noteRemoveCancelBlockEl.style.display = 'none';
				clearInterval(timerInterval);
			});
		});
	}

};

NotesApp.start();