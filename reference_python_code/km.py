

import time
from PyQt5 import uic
from PyQt5 import QtWidgets

from PyQt5.QtWidgets import QTextEdit
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import QStyledItemDelegate
from PyQt5.QtGui import QBrush, QColor,QTextCursor,QMouseEvent



import os
import sys
import json
import signal
import string
import argparse

from pydub import AudioSegment
import simpleaudio as sa

def change_playback_speed(sound, speed=1.0):
    new_frame_rate = int(sound.frame_rate * speed)
    sound_with_new_frame_rate = sound._spawn(sound.raw_data, overrides={'frame_rate': new_frame_rate})
    return sound_with_new_frame_rate.set_frame_rate(sound.frame_rate)
import re

# All Arabic combining marks (tashkīl)
DIACRITICS = r'\u0610-\u061A\u064B-\u0652\u06D6-\u06ED'

# After each letter in your core word, we allow *any* number of diacritics
COMBINING = rf'[{DIACRITICS}]*'

# Define what our “word‐character” is, so our lookarounds treat diacritics as inside‐the‐word
WORD_CHAR = rf'[\w{DIACRITICS}]'

# The prefixes we’ll accept in front of your core – but never color unless
# that prefix is actually part of your conjugation entry.
_PREFIXES = ["لل", "و", "ب", "ل", "ف", "ك"]

def strip_diacritics(s: str) -> str:
    """Remove any tashkīl from your conjugation entry."""
    return re.sub(rf'[{DIACRITICS}]', '', s)

def highlight_conjugations(text: str, conjugations: list[str]) -> str:
    # Sort longest→shortest so “كتاب” wins over “كتب”
    for conj in sorted(conjugations, key=len, reverse=True):
        # 1) Strip any diacritics the user provided, we’ll re‐allow them in matching
        core_plain = strip_diacritics(conj)
        if not core_plain:
            continue

        # 2) Build a diacritic‐tolerant regex for that core word
        #    e.g. if core_plain = "به", this becomes "ب[ـ]*ه[ـ]*"
        escaped = ''.join(re.escape(ch) + COMBINING for ch in core_plain)

        # 3) Build a single regex with:
        #    - custom "no word‐char" lookaround before
        #    - an optional prefix group (we won't color this)
        #    - the core group (we *will* color this)
        #    - custom lookahead after
        prefix_alt = '|'.join(re.escape(p) for p in _PREFIXES)
        pattern = re.compile(
            rf'(?<!{WORD_CHAR})'             # not preceded by letter/digit/underscore/diacritic
            rf'(?P<prefix>(?:{prefix_alt}))?' # optional one of our prefixes
            rf'(?P<core>{escaped})'           # the core word, with diacritics allowed
            rf'(?!{WORD_CHAR})',              # not followed by letter/digit/underscore/diacritic
            flags=re.UNICODE
        )

        # 4) Replace each match by re-inserting prefix un‐touched, coloring only core
        def _repl(m):
            pre  = m.group('prefix') or ''
            cor  = m.group('core')
            return f"{pre}<span style='color:#66d855'>{cor}</span>"

        text = pattern.sub(_repl, text)

    return text


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Set environment variable
os.environ['QT_MAC_FORCE_LIGHTMODE'] = '1'
#os.environ['QT_QPA_PLATFORM'] = 'cocoa'  # Force macOS native backend
light_style = """
    QWidget {
        background-color: #ffffff;
        color: #000000;
    }
    QLabel {
        color: #000000;
    }
"""

def parse_args():
    # directory where the data is stored
    parser = argparse.ArgumentParser(description="Data Indexing")
    parser.add_argument("--resources", type=str, default=f"{BASE_DIR}/assets/resources.json", help="Directory where the data is stored")
    parser.add_argument("--dataset", type=str, default=f"{BASE_DIR}/assets/dataset.json", help="Where to save the data")
    parser.add_argument("--ai", type=str, default=f"{BASE_DIR}/assets/spectrum.json", help="AI provider")

    return parser.parse_args()


ARABIC_PUNCTUATION = '،:؟؛«»'

QUi_KM, Ui_Ui_KM = uic.loadUiType(f"{BASE_DIR}/assets/km.ui", resource_suffix='')

signal.signal(signal.SIGINT, signal.SIG_DFL)

def split_by_period(text):
    """
    Splits text by periods except those within parentheses.
    
    Args:
        text (str): Input text to be split
        
    Returns:
        list: List of sentences, with whitespace stripped
    """
    results = []
    current_sentence = ""
    paren_count = 0
    
    for char in text:
        current_sentence += char
        
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count = max(0, paren_count - 1)  # Prevent negative count
        elif char == '.' and paren_count == 0:
            # Only split if we're not inside parentheses
            results.append(current_sentence.strip())
            current_sentence = ""
            
    # Add the last sentence if it doesn't end with a period
    if current_sentence.strip():
        results.append(current_sentence.strip())
        
    return results

class ColorDelegate(QStyledItemDelegate):
    def __init__(self, roots, data, parent=None):
        super().__init__(parent)
        self.data = data
        self.roots = roots
    def initStyleOption(self, option, index):
        super(ColorDelegate, self).initStyleOption(option, index)
        # highlight color
        item = index.row()
        # get the root from the list of roots
        root  = self.roots[item]
        if root in self.data:
            option.backgroundBrush = QBrush(QColor("green"))
        else:
            # no background 
            pass

    def paint(self, painter, option, index):
        # highlight color
        item = index.row()
        # get the root from the list of roots
        root  = self.roots[item]
        if root in self.data:
            option.backgroundBrush = QBrush(QColor("green"))
        else:
            # no background 
            pass

        # Call the base class method to draw the item as usual
        super().paint(painter, option, index)

class ClickableLabel(QTextEdit):
    wordClicked = pyqtSignal(str)
    def __init__(self, parent=None):
        super().__init__(parent)
        self.words = []  # List of words to display
        self.selected_words = set()  # Set to keep track of selected words
        self.setMouseTracking(True)
        self.current_word = None
        
    def update_data(self, text, selected_words):
        """
        Updates the data with a text that may contain HTML and selected words.
        """
        self.selected_words = selected_words

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            if self.word:
                self.wordClicked.emit(self.word)  # Emit the word clicked

    def mouseMoveEvent(self, mouse_event: QMouseEvent) -> None:
        if self.underMouse():
            # create a QTextCursor at that position and select text
            text_cursor = self.cursorForPosition(mouse_event.pos())
            text_cursor.select(QTextCursor.WordUnderCursor)

            word_under_cursor = text_cursor.selectedText()
            self.word = word_under_cursor
        else:
            self.word = None



def unique(sequence):
    seen = set()
    return [x for x in sequence if not (x in seen or seen.add(x))]

class Ui_KM(QUi_KM, Ui_Ui_KM):
    def __init__(self, resources_file,dataset_file,mojam,parent=None):
        super(Ui_KM,self).__init__(parent)
        self.setupUi(self)
        self.dataset_file = dataset_file
        self.horizontalLayout_2.removeWidget(self.lbl_source)
        self.lbl_source = ClickableLabel()
        # remove current placeholder from horizontalLayout_2 layout and add the label
        self.horizontalLayout_2.addWidget(self.lbl_source)
        # make font pointsize 18
        #font = self.lbl_source.font()
        #font.setPointSize(18)
        #self.lbl_source.setFont(font)

        self.lbl_source.wordClicked.connect(self.handle_word_click)
        self.lbl_source.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.sorted = False
        self.from_save = False

        
        self.mojam = mojam
        self.dataset_file = dataset_file
        self.current_words = []

        # load resources
        with open(resources_file) as f:
            self.resources = json.load(f)
        
        # load ai data
        with open(args.ai) as f:
            self.ai_data = json.load(f)
    
        if os.path.exists(dataset_file):
            with open(dataset_file) as f:
                self.data = json.load(f)
                if self.mojam not in self.data:
                    self.data[self.mojam] = {}
                self.mojam_data = self.data[self.mojam]
        else:
            self.data = {}
            self.data[self.mojam] = {}
            self.mojam_data = self.data[self.mojam]
        
        self.roots = list(self.resources[self.mojam].keys())
        self.current_roots = self.roots

        self._populate_list_view()
        # add signal to list of words index changed
        self.ls_roots.selectionModel().selectionChanged.connect(self.on_ls_roots_changed)
        self.delegate = ColorDelegate(self.current_roots,self.mojam_data)
        self.ls_roots.setItemDelegate(self.delegate)
    
    def _populate_list_view(self):
        # pupulate ls model
        for i, item in enumerate(self.current_roots):
            self.ls_roots.addItem(item+" "+ str(len(self.resources[self.mojam][item].split())))    
        self.current_idx = -1
        # set the first item
        self.ls_roots.setCurrentRow(0)
        self.on_ls_roots_changed()
            
    def on_ls_roots_changed(self):
        if len(self.ls_roots.selectedIndexes()) == 0:
            return
     
        if not self.from_save and self.ck_autosave.isChecked() and len(self.current_words) > 0:
            self.mojam_data[self.current_roots[self.current_idx]] = self.current_words
            self.on_pb_save_clicked()
       
        if self.from_save:
            self.from_save = False
        # get the selected item
        
        item = self.ls_roots.selectedIndexes()[0]
        idx = item.row()
        
        self.current_idx = idx
        self._populate_ls_words(idx)
        n_answer = len(self.mojam_data)
        self.lbl_completed.setText(f"Completed: {n_answer}/{len(self.resources[self.mojam])}")
        self._populate_text_view(self.current_idx)
        # push scroller to the top
        self.lbl_source.verticalScrollBar().setValue(0)
        self.scrollArea2.verticalScrollBar().setValue(0)

    def _populate_ls_words(self,idx):
        # get root
        root = self.current_roots[idx]
        context = self.resources[self.mojam][root]
        if root in self.mojam_data:
            self.current_words = self.mojam_data[root]
        else: 
            print(root)
            self.current_words = self.get_words(context)
            print(self.current_words)
        
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(0)  
    
    def full_preserve(self,text):
        c = self.lbl_source.textCursor()
        p = c.position()
        a = c.anchor()

        vsb = self.lbl_source.verticalScrollBar()
        old_pos_ratio = vsb.value() / (vsb.maximum() or 1)

        self.lbl_source.setText(text)

        c.setPosition(a)
        op = QTextCursor.NextCharacter if p > a else QTextCursor.PreviousCharacter
        c.movePosition(op, QTextCursor.KeepAnchor, abs(p - a))
        self.lbl_source.setTextCursor(c)

        vsb.setValue(round(old_pos_ratio * vsb.maximum()))
    
    def _populate_text_view(self, itemidx):
        root = self.current_roots[itemidx]
        context = self.resources[self.mojam][root]
        if root in self.ai_data:
            ai_context = self.ai_data[root]
        else:
            ai_context = ""
        # # right to left
        
        html_text = """
            <html dir="rtl">
            <div style=" word-wrap: normal;line-height: 40px;font-size: 24px; margin-right: 20px">
            {}</div>
            </html>"""
        
        text = context
        conjugations = self.current_words
        # sort from longer to shorter
        conjugations = sorted(conjugations,key=lambda x: len(x),reverse=True)

        text = highlight_conjugations(text,conjugations)    
        context_html_text = html_text.format("<br/><br/>".join(split_by_period(text)))
        
        context_html_text = context_html_text.format(text)

        
        self.full_preserve(context_html_text)
        self.lbl_source.update_data(text,self.current_words)

        ai_context_html_text = html_text.format("<br/><br/>".join(ai_context.split(".")))
        ai_context_html_text = ai_context_html_text.format(ai_context)
        self.lbl_ai.setText(ai_context_html_text)
        
    def handle_word_click(self, w):
        """
        Handles the word click by toggling it in the selected words list
        and updating the label's text.
        """
        # current root
        root = self.current_roots[self.current_idx]
        w  = w.translate(str.maketrans('', '', string.punctuation+ ARABIC_PUNCTUATION))
        if w.startswith("ك") and not root.startswith("ك"):
                w = w[1:]
        elif w.startswith("ب") and not root.startswith("ب"):
            w = w[1:]
        elif w.startswith("ل") and not root.startswith("ل"):
            w = w[1:]
        elif w.startswith("ف") and not root.startswith("ف"):
            w = w[1:]
        elif w.startswith("و") and not root.startswith("و"):
            w = w[1:]
        elif w.startswith("وو") and root.startswith("و"):
            w = w[1:]
        # check if word starts with haraka or not
        if w.startswith("َ") or w.startswith("ُ") or w.startswith("ِ") or w.startswith("ً") or w.startswith("ٌ") or w.startswith("ٍ"):
            w = w[1:]
        if w in self.current_words:
            print("deleting",w)
            # remove the word from the list
            self.current_words.remove(w)
        else:
            # add the word to the list
            self.current_words.append(w)

        # update the list view
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(0)  
        # update the text view
        self._populate_text_view(self.current_idx)
        # select the last word
        self.ls_words.setCurrentRow(len(self.current_words) - 1)

    def get_words(self,context):
        similar_words = []
        root = self.current_roots[self.current_idx]
        root = root.replace("أ","ء").replace("ئ","ء").replace("ؤ","ء").replace("إ","ء")
        root_no_tashkeel = "".join([c for c in root if c.isalpha()])
        # if root ends with 2 same letters, find that letter
        if root[-1] == root[-2]:
            shaddah_letter = root[-1]
        else:
            shaddah_letter = None
        for act_word in context.split():
            act_word = act_word.translate(str.maketrans('', '', string.punctuation+ARABIC_PUNCTUATION))
            w_no_tashkeel = "".join([c for c in act_word if c.isalpha()])
            w_no_tashkeel = w_no_tashkeel.replace("أ","ء").replace("ئ","ء").replace("ؤ","ء").replace("إ","ء")
            w_no_tashkeel = w_no_tashkeel.replace("ا","ايو").replace("ي","ايو").replace("و","ايو")
            if shaddah_letter:
                w_no_tashkeel = w_no_tashkeel.replace(shaddah_letter,shaddah_letter+shaddah_letter)
                
            i = 0
            j = 0
            good = False
            while i < len(root_no_tashkeel) and j < len(w_no_tashkeel):

                if root_no_tashkeel[i] == 'ا':
                    i += 1
                elif root_no_tashkeel[i] == w_no_tashkeel[j]:
                    i += 1
                    j += 1
                else:
                    j += 1
                if i == len(root_no_tashkeel):
                    good = True
                    break
            if good:
                similar_words.append(act_word)
                # if not root.startswith("ول") and w_no_tashkeel.startswith("وال"):
                #     w_no_tashkeel = w_no_tashkeel[3:]
                # elif w_no_tashkeel.startswith("ال"):
                #     w_no_tashkeel = w_no_tashkeel[2:]
                # elif root[0] != "و" and w_no_tashkeel.startswith("و"):
                #     w_no_tashkeel = w_no_tashkeel[1:]
        
     
        
        # remove ك ب ل ف from the begginging if the root doesn't start with either
        for i,w in enumerate(similar_words):
            if w.startswith("ك") and not root.startswith("ك"):
                w = w[1:]
            elif w.startswith("ب") and not root.startswith("ب"):
                w = w[1:]
            elif w.startswith("ل") and not root.startswith("ل"):
                w = w[1:]
            elif w.startswith("ف") and not root.startswith("ف"):
                w = w[1:]
            elif w.startswith("و") and not root.startswith("و"):
                w = w[1:]
            elif w.startswith("وو") and root.startswith("و"):
                w = w[1:]
            similar_words[i] = w
            # check if word starts with haraka or not
            if w.startswith("َ") or w.startswith("ُ") or w.startswith("ِ") or w.startswith("ً") or w.startswith("ٌ") or w.startswith("ٍ"):
                w = w[1:]
                similar_words[i] = w
                
        return unique(similar_words)
    
    def on_pb_save_clicked(self):
        with open(self.dataset_file,"w",encoding="utf-8") as f:
            json.dump(self.data,f,ensure_ascii=False,indent=4)
    
    def on_pb_play_released(self):
        root = self.current_roots[self.current_idx]
        file_path = os.path.join(BASE_DIR, "audio/processed", f"{root}.mp3")
        if os.path.exists(file_path):
            audio = AudioSegment.from_file(file_path, format="mp3")

            # Apply playback speed change from, for example, a text field:
            speed_factor = float(self.txt_playspeed.toPlainText())
            processed_audio = change_playback_speed(audio, speed=speed_factor)

            # Save audio and parameters for pause/resume handling
            self.current_audio = processed_audio
            self.current_params = {
                'num_channels': processed_audio.channels,
                'bytes_per_sample': processed_audio.sample_width,
                'sample_rate': processed_audio.frame_rate
            }
            self.current_raw = processed_audio.raw_data

            # Start playback from the beginning
            self.play_obj = sa.play_buffer(self.current_raw,
                                           self.current_params['num_channels'],
                                           self.current_params['bytes_per_sample'],
                                           self.current_params['sample_rate'])
            self.start_time = time.time()
            self.pause_time = None
        else:
            print(f"File {file_path} does not exist.")

    def on_pb_pause_released(self):
        if self.play_obj is not None:
            # Calculate elapsed playback time
            if self.pause_time is None:
                elapsed = time.time() - self.start_time
            else:
                elapsed = self.pause_time  # if already paused, do nothing further
                return

            # Stop playback
            self.play_obj.stop()
            self.play_obj = None
            self.pause_time = elapsed
            print(f"Paused at {elapsed} seconds.")

    def on_pb_resume_released(self):
        if self.current_audio is not None and self.pause_time is not None:
            # Calculate the starting point in milliseconds
            start_ms = int(self.pause_time * 1000)
            remaining_audio = self.current_audio[start_ms:]
            raw_data = remaining_audio.raw_data

            # Resume playback from the saved position
            self.play_obj = sa.play_buffer(raw_data,
                                           self.current_params['num_channels'],
                                           self.current_params['bytes_per_sample'],
                                           self.current_params['sample_rate'])
            # Update start_time to the resume time (or maintain cumulative time if needed)
            self.start_time = time.time() - self.pause_time
            self.pause_time = None
            print("Resumed playback.")

    def on_pb_stop_released(self):
        if self.play_obj is not None:
            self.play_obj.stop()
            self.play_obj = None
            self.start_time = None
            self.pause_time = None
            print("Stopped playback.")

    def on_pb_delete_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # remove the word from the list
        self.current_words.pop(idx)
        # update the list view
        self._populate_ls_words(self.current_idx)
        # update the text view
        self._populate_text_view(self.current_idx)
    
    def on_pb_k_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # add ك to the beginning of the word
        word = self.current_words[idx]
        word = "ك" + word
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 
        
    def on_pb_b_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # add ب to the beginning of the word
        word = self.current_words[idx]
        word = "ب" + word
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 
    
    def on_pb_f_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # add ف to the beginning of the word
        word = self.current_words[idx]
        word = "ف" + word
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 
    
    def on_pb_l_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # add ل to the beginning of the word
        word = self.current_words[idx]
        word = "ل" + word
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 

    def on_pb_w_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # add و to the beginning of the word
        word = self.current_words[idx]
        word = "و" + word
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 

    def on_pb_u_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # remove ل from the beginning of the word
        word = self.current_words[idx]
        # add َ to the first letter of the word
        word = word[0] + "َ" + word[1:]
        
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 

    def on_pb_o_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # remove ل from the beginning of the word
        word = self.current_words[idx]
        # add ُ to the first letter of the word
        word = word[0] + "ُ" + word[1:]
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 

    def on_pb_d_released(self):
        # get selected word from the list if any
        item = self.ls_words.selectedIndexes()
        if len(item) == 0:
            return
        idx = item[0].row()
        # remove ل from the beginning of the word
        word = self.current_words[idx]
        word = word[0] + "ِ" + word[1:]
        # update the word in the list
        self.current_words[idx] = word
        self.ls_words.clear()
        for word in self.current_words:
            self.ls_words.addItem(word)
        self.ls_words.setCurrentRow(idx) 

    def on_pb_reset_released(self):
        # this function reset words for the current root to the context words
        root = self.current_roots[self.current_idx]
        context = self.resources[self.mojam][root]
        # delete this root from the data
        if root in self.mojam_data:
            del self.mojam_data[root]
        
        # add 1 to the current index if it is not the last one
        if self.current_idx < len(self.current_roots) - 1:
            self.current_idx += 1
        # select the next root
        self.ls_roots.setCurrentRow(self.current_idx)
    
    def on_pb_sort_released(self):
        if not self.sorted:
            self.sorted = True
            # descending order
            self.current_roots = sorted(self.roots,key=lambda x: len(self.resources[self.mojam][x].split()))
        else:
            self.sorted = False
            self.current_roots = self.roots

        self.delegate.roots = self.current_roots
        
        # clear the list view
        self.ls_roots.clear()
        
        # populate the list view
        not_yet = []
        for i, item in enumerate(self.current_roots):
            if i > 7300:
                not_yet.append(item)
            self.ls_roots.addItem(item+" "+ str(len(self.resources[self.mojam][item].split())))
        with open("audio/not_yet.json","w") as f:
            json.dump({"data":not_yet},f,indent=4,ensure_ascii=False)
        self.from_save = True
        self.current_idx = 0
        self.ls_roots.setCurrentRow(0)

    def on_pb_sort_a_released(self):
        if not self.sorted:
            self.sorted = True
            # descending order
            self.current_roots = sorted(self.roots)
        else:
            self.sorted = False
            self.current_roots = self.roots

        self.delegate.roots = self.current_roots
        
        # clear the list view
        self.ls_roots.clear()
        
        # populate the list view
        for i, item in enumerate(self.current_roots):
            self.ls_roots.addItem(item)
        self.from_save = True
        self.current_idx = 0
        self.ls_roots.setCurrentRow(0)


    def on_pb_reload_released(self):
        with open(dataset_file) as f:
            self.data = json.load(f)
            self.mojam_data = self.data[self.mojam]
            self.delegate.data = self.mojam_data

if __name__ == '__main__':
    
    args = parse_args()
    # get resources file and dataset file from the arguments
    resources_file = args.resources
    dataset_file = args.dataset

    

    app = QtWidgets.QApplication(sys.argv)
    app.setStyle('Fusion')
    app.setAttribute(Qt.AA_DisableHighDpiScaling)
    app.setStyleSheet(light_style)
 
    form = Ui_KM(resources_file,dataset_file,"لسان العرب")
    form.show()
    sys.exit(app.exec_())
