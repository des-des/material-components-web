/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import MDCFoundation from '@material/base/foundation';
import {MDCTextFieldAdapter, NativeInputType, FoundationMapType} from './adapter';
import MDCTextFieldBottomLineFoundation from './bottom-line/foundation';
/* eslint-disable no-unused-vars */
import MDCTextFieldHelperTextFoundation from './helper-text/foundation';
import MDCTextFieldIconFoundation from './icon/foundation';
import MDCTextFieldLabelFoundation from './label/foundation';
/* eslint-enable no-unused-vars */
import {cssClasses, strings} from './constants';


/**
 * @extends {MDCFoundation<!MDCTextFieldAdapter>}
 * @final
 */
class MDCTextFieldFoundation extends MDCFoundation {
  /** @return enum {string} */
  static get cssClasses() {
    return cssClasses;
  }

  /** @return enum {string} */
  static get strings() {
    return strings;
  }

  /**
   * {@see MDCTextFieldAdapter} for typing information on parameters and return
   * types.
   * @return {!MDCTextFieldAdapter}
   */
  static get defaultAdapter() {
    return /** @type {!MDCTextFieldAdapter} */ ({
      addClass: () => {},
      removeClass: () => {},
      registerTextFieldInteractionHandler: () => {},
      deregisterTextFieldInteractionHandler: () => {},
      registerInputInteractionHandler: () => {},
      deregisterInputInteractionHandler: () => {},
      registerBottomLineEventHandler: () => {},
      deregisterBottomLineEventHandler: () => {},
      getNativeInput: () => {},
    });
  }

  /**
   * @param {!MDCTextFieldAdapter=} adapter
   * @param {!FoundationMapType=} foundationMap Map from subcomponent names to their subfoundations.
   */
  constructor(adapter = /** @type {!MDCTextFieldAdapter} */ ({}),
    foundationMap = /** @type {!FoundationMapType} */ ({})) {
    super(Object.assign(MDCTextFieldFoundation.defaultAdapter, adapter));

    /** @type {!MDCTextFieldBottomLineFoundation|undefined} */
    this.bottomLine_ = foundationMap.bottomLine;
    /** @type {!MDCTextFieldHelperTextFoundation|undefined} */
    this.helperText_ = foundationMap.helperText;
    /** @type {!MDCTextFieldIconFoundation|undefined} */
    this.icon_ = foundationMap.icon;
    /** @type {!MDCTextFieldLabelFoundation|undefined} */
    this.label_ = foundationMap.label;

    /** @private {boolean} */
    this.isFocused_ = false;
    /** @private {boolean} */
    this.receivedUserInput_ = false;
    /** @private {boolean} */
    this.useCustomValidityChecking_ = false;
    /** @private {function(): undefined} */
    this.inputFocusHandler_ = () => this.activateFocus();
    /** @private {function(): undefined} */
    this.inputBlurHandler_ = () => this.deactivateFocus();
    /** @private {function(): undefined} */
    this.inputInputHandler_ = () => this.autoCompleteFocus();
    /** @private {function(!Event): undefined} */
    this.setPointerXOffset_ = (evt) => this.setBottomLineTransformOrigin(evt);
    /** @private {function(!Event): undefined} */
    this.textFieldInteractionHandler_ = () => this.handleTextFieldInteraction();
    /** @private {function(!Event): undefined} */
    this.bottomLineAnimationEndHandler_ = () => this.handleBottomLineAnimationEnd();
  }

  init() {
    this.adapter_.addClass(MDCTextFieldFoundation.cssClasses.UPGRADED);
    // Ensure label does not collide with any pre-filled value.
    if (this.getNativeInput_().value && this.label_) {
      this.label_.floatAbove();
    }

    this.adapter_.registerInputInteractionHandler('focus', this.inputFocusHandler_);
    this.adapter_.registerInputInteractionHandler('blur', this.inputBlurHandler_);
    this.adapter_.registerInputInteractionHandler('input', this.inputInputHandler_);
    ['mousedown', 'touchstart'].forEach((evtType) => {
      this.adapter_.registerInputInteractionHandler(evtType, this.setPointerXOffset_);
    });
    ['click', 'keydown'].forEach((evtType) => {
      this.adapter_.registerTextFieldInteractionHandler(evtType, this.textFieldInteractionHandler_);
    });
    this.adapter_.registerBottomLineEventHandler(
      MDCTextFieldBottomLineFoundation.strings.ANIMATION_END_EVENT, this.bottomLineAnimationEndHandler_);
  }

  destroy() {
    this.adapter_.removeClass(MDCTextFieldFoundation.cssClasses.UPGRADED);
    this.adapter_.deregisterInputInteractionHandler('focus', this.inputFocusHandler_);
    this.adapter_.deregisterInputInteractionHandler('blur', this.inputBlurHandler_);
    this.adapter_.deregisterInputInteractionHandler('input', this.inputInputHandler_);
    ['mousedown', 'touchstart'].forEach((evtType) => {
      this.adapter_.deregisterInputInteractionHandler(evtType, this.setPointerXOffset_);
    });
    ['click', 'keydown'].forEach((evtType) => {
      this.adapter_.deregisterTextFieldInteractionHandler(evtType, this.textFieldInteractionHandler_);
    });
    this.adapter_.deregisterBottomLineEventHandler(
      MDCTextFieldBottomLineFoundation.strings.ANIMATION_END_EVENT, this.bottomLineAnimationEndHandler_);
  }

  /**
   * Handles user interactions with the Text Field.
   */
  handleTextFieldInteraction() {
    if (this.adapter_.getNativeInput().disabled) {
      return;
    }
    this.receivedUserInput_ = true;
  }

  /**
   * Activates the text field focus state.
   */
  activateFocus() {
    const {FOCUSED} = MDCTextFieldFoundation.cssClasses;
    this.adapter_.addClass(FOCUSED);
    if (this.bottomLine_) {
      this.bottomLine_.activate();
    }
    if (this.label_) {
      this.label_.floatAbove();
    }
    if (this.helperText_) {
      this.helperText_.showToScreenReader();
    }
    this.isFocused_ = true;
  }

  /**
   * Sets the bottom line's transform origin, so that the bottom line activate
   * animation will animate out from the user's click location.
   * @param {!Event} evt
   */
  setBottomLineTransformOrigin(evt) {
    if (this.bottomLine_) {
      this.bottomLine_.setTransformOrigin(evt);
    }
  }

  /**
   * Activates the Text Field's focus state in cases when the input value
   * changes without user input (e.g. programatically).
   */
  autoCompleteFocus() {
    if (!this.receivedUserInput_) {
      this.activateFocus();
    }
  }

  /**
   * Handles when bottom line animation ends, performing actions that must wait
   * for animations to finish.
   */
  handleBottomLineAnimationEnd() {
    // We need to wait for the bottom line to be entirely transparent
    // before removing the class. If we do not, we see the line start to
    // scale down before disappearing
    if (!this.isFocused_ && this.bottomLine_) {
      this.bottomLine_.deactivate();
    }
  }

  /**
   * Deactives the Text Field's focus state.
   */
  deactivateFocus() {
    const {FOCUSED} = MDCTextFieldFoundation.cssClasses;
    const input = this.getNativeInput_();
    const shouldRemoveLabelFloat = !input.value && !this.isBadInput_();

    this.isFocused_ = false;
    this.adapter_.removeClass(FOCUSED);
    if (this.label_) {
      this.label_.deactivateFocus(shouldRemoveLabelFloat);
    }
    if (shouldRemoveLabelFloat) {
      this.receivedUserInput_ = false;
    }

    if (!this.useCustomValidityChecking_) {
      this.changeValidity_(input.checkValidity());
    }
  }

  /**
   * Updates the Text Field's valid state based on the supplied validity.
   * @param {boolean} isValid
   * @private
   */
  changeValidity_(isValid) {
    const {INVALID} = MDCTextFieldFoundation.cssClasses;
    if (isValid) {
      this.adapter_.removeClass(INVALID);
    } else {
      this.adapter_.addClass(INVALID);
    }
    if (this.helperText_) {
      this.helperText_.setValidity(isValid);
    }
    if (this.label_) {
      this.label_.setValidity(isValid);
    }
  }

  /**
   * @return {boolean} True if the Text Field input fails validity checks.
   * @private
   */
  isBadInput_() {
    const input = this.getNativeInput_();
    return input.validity ? input.validity.badInput : input.badInput;
  }

  /**
   * @return {boolean} True if the Text Field is disabled.
   */
  isDisabled() {
    return this.getNativeInput_().disabled;
  }

  /**
   * @param {boolean} disabled Sets the text-field disabled or enabled.
   */
  setDisabled(disabled) {
    const {DISABLED, INVALID} = MDCTextFieldFoundation.cssClasses;
    this.getNativeInput_().disabled = disabled;
    if (disabled) {
      this.adapter_.addClass(DISABLED);
      this.adapter_.removeClass(INVALID);
    } else {
      this.adapter_.removeClass(DISABLED);
    }
    if (this.icon_) {
      this.icon_.setDisabled(disabled);
    }
  }

  /**
   * @param {string} content Sets the content of the helper text.
   */
  setHelperTextContent(content) {
    if (this.helperText_) {
      this.helperText_.setContent(content);
    }
  }

  /**
   * @return {!Element|!NativeInputType} The native text input from the
   * host environment, or a dummy if none exists.
   * @private
   */
  getNativeInput_() {
    return this.adapter_.getNativeInput() ||
    /** @type {!NativeInputType} */ ({
      checkValidity: () => true,
      value: '',
      disabled: false,
      badInput: false,
    });
  }

  /**
   * @param {boolean} isValid Sets the validity state of the Text Field.
   */
  setValid(isValid) {
    this.useCustomValidityChecking_ = true;
    this.changeValidity_(isValid);
  }
}

export default MDCTextFieldFoundation;
