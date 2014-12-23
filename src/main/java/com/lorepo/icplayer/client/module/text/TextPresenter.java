package com.lorepo.icplayer.client.module.text;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.dom.client.Element;
import com.google.gwt.dom.client.InputElement;
import com.google.gwt.dom.client.SelectElement;
import com.google.gwt.event.shared.EventBus;
import com.google.gwt.user.client.DOM;
import com.google.gwt.user.client.Window;
import com.lorepo.icf.scripting.ICommandReceiver;
import com.lorepo.icf.scripting.IStringType;
import com.lorepo.icf.scripting.IType;
import com.lorepo.icf.utils.JSONUtils;
import com.lorepo.icf.utils.StringUtils;
import com.lorepo.icplayer.client.module.api.IActivity;
import com.lorepo.icplayer.client.module.api.IModuleModel;
import com.lorepo.icplayer.client.module.api.IModuleView;
import com.lorepo.icplayer.client.module.api.IPresenter;
import com.lorepo.icplayer.client.module.api.IStateful;
import com.lorepo.icplayer.client.module.api.event.CustomEvent;
import com.lorepo.icplayer.client.module.api.event.DefinitionEvent;
import com.lorepo.icplayer.client.module.api.event.ResetPageEvent;
import com.lorepo.icplayer.client.module.api.event.ShowErrorsEvent;
import com.lorepo.icplayer.client.module.api.event.ValueChangedEvent;
import com.lorepo.icplayer.client.module.api.event.WorkModeEvent;
import com.lorepo.icplayer.client.module.api.event.dnd.DraggableItem;
import com.lorepo.icplayer.client.module.api.event.dnd.DraggableText;
import com.lorepo.icplayer.client.module.api.event.dnd.ItemConsumedEvent;
import com.lorepo.icplayer.client.module.api.event.dnd.ItemReturnedEvent;
import com.lorepo.icplayer.client.module.api.event.dnd.ItemSelectedEvent;
import com.lorepo.icplayer.client.module.api.player.IPlayerCommands;
import com.lorepo.icplayer.client.module.api.player.IPlayerServices;
import com.lorepo.icplayer.client.module.api.player.IScoreService;
import com.lorepo.icplayer.client.module.text.LinkInfo.LinkType;

public class TextPresenter implements IPresenter, IStateful, IActivity, ICommandReceiver {

	public interface TextElementDisplay {
		boolean hasId(String id);
		void setShowErrorsMode(boolean isActivity);
		void setWorkMode();
		void reset();
		void setText(String text);
		String getTextValue();
		void markGapAsCorrect();
		void markGapAsWrong();
		void markGapAsEmpty();
		boolean isAttempted();
		void setDisabled(boolean disabled);
		boolean isDisabled();
		void setStyleShowAnswers();
		void removeStyleHideAnswers();
	}
	
	public interface IDisplay extends IModuleView {
		void addListener(ITextViewListener l); 
		void setHTML(String html);
		String getHTML();
		void connectGaps(Iterator<GapInfo> giIterator);
		void connectFilledGaps(Iterator<GapInfo> giIterator);
		void connectDraggableGaps(Iterator<GapInfo> giIterator);
		void connectInlineChoices(Iterator<InlineChoiceInfo> giIterator);
		void connectLinks(Iterator<LinkInfo> giIterator);
		int getChildrenCount();
		TextElementDisplay getChild(int index);
		void setValue(String id, String value);
		void refreshMath();
		void hide();
		void show(boolean b);
		Element getElement();
		void connectMathGap(Iterator<GapInfo> giIterator, String id, ArrayList<Boolean> savedDisabledState);
	}
	
	private TextModel module;
	private IPlayerServices playerServices;
	private IDisplay view;
	private HashMap<String, String> values = new HashMap<String, String>();
	private HashMap<String, DraggableItem> consumedItems = new HashMap<String, DraggableItem>();
	private DraggableItem draggableItem;
	private JavaScriptObject jsObject;
	private String enteredText = null;
	private boolean isVisible;
	private ArrayList<Boolean> savedDisabledState = new ArrayList<Boolean>();
	private boolean isShowAnswersActive = false;
	private boolean isShowErrorsMode = false;
	private String currentState = "";
	private HashMap<String, GapInfo> gapInfos = new HashMap<String, GapInfo>();
	
	public TextPresenter(TextModel module, IPlayerServices services) {
		this.module = module;
		this.playerServices = services;
		isVisible = module.isVisible();

		connectHandlers();
	}
	
	private void connectHandlers() {
		EventBus eventBus = playerServices.getEventBus();
		
		eventBus.addHandler(ShowErrorsEvent.TYPE, new ShowErrorsEvent.Handler() {
			public void onShowErrors(ShowErrorsEvent event) {
				setShowErrorsMode();
			}
		});

		eventBus.addHandler(WorkModeEvent.TYPE, new WorkModeEvent.Handler() {
			public void onWorkMode(WorkModeEvent event) {
				setWorkMode();
			}
		});

		eventBus.addHandler(ResetPageEvent.TYPE, new ResetPageEvent.Handler() {
			public void onResetPage(ResetPageEvent event) {
				reset();
			}
		});

		eventBus.addHandler(ItemSelectedEvent.TYPE, new ItemSelectedEvent.Handler() {
			public void onItemSelected(ItemSelectedEvent event) {
				if(event.getItem() instanceof DraggableText){
					draggableItem = event.getItem();
				}
			}
		});
		
		eventBus.addHandler(ItemConsumedEvent.TYPE, new ItemConsumedEvent.Handler() {
			public void onItemConsumed(ItemConsumedEvent event) {
				draggableItem = null;
			}
		});
		
		eventBus.addHandler(CustomEvent.TYPE, new CustomEvent.Handler() {
			@Override
			public void onCustomEventOccurred(CustomEvent event) {
				if (event.eventName.equals("ShowAnswers")) {
					showAnswers();
				} else if (event.eventName.equals("HideAnswers")) {
					hideAnswers();
				}
			}
		});
	}
	
	private boolean isShowAnswers() {
		if (!module.isActivity()) {
			return false;
		}
		
		return this.isShowAnswersActive;
	}
	
	int getOptionIndex(InlineChoiceInfo choice, String optionName) {
		int index = 0;
		
		Iterator<String> distractors = choice.getDistractors();
		while (distractors.hasNext()) {
			String distractor = distractors.next();
			if (distractor.equals(optionName)) return index;
			index++;
		}
		
		return -1;
	}
	
	private void showAnswers() {
		if (!module.isActivity()) {
			if (this.isShowErrorsMode) {
				setWorkMode();
			}
			
			return;
		}
		
		this.currentState = getState();
		this.isShowAnswersActive = true;
		
		for (int i = 0; i < view.getChildrenCount(); i++) {
			TextElementDisplay child = view.getChild(i);
			child.reset();
			child.setStyleShowAnswers();
		}

		List<GapInfo> gapsInfos = module.getGapInfos();
		for (int index = 0; index < gapsInfos.size(); index++) {
			TextElementDisplay gap = view.getChild(index);
			
			GapInfo gi = gapsInfos.get(index);
			
			// show only 1st answer
			Iterator<String> answers = gi.getAnswers();
			gap.setText(answers.hasNext() ? answers.next() : "");
		}
		
		int dropDownCounter = gapsInfos.size() + 1;
		for (InlineChoiceInfo choice : module.getChoiceInfos()) {
			String id = module.getGapUniqueId() + '-' + dropDownCounter++;
			Element elem = DOM.getElementById(id);
			SelectElement sElem = (SelectElement) elem;
			
			int correctIndex = getOptionIndex(choice, choice.getAnswer());
			if (correctIndex != -1)
				sElem.setSelectedIndex(correctIndex + 1);
		}
		
		view.refreshMath();
	}

	private void hideAnswers() {
		if (!module.isActivity()) {
			return;
		}
		
		for (int i = 0; i < view.getChildrenCount(); i++) {
			TextElementDisplay child = view.getChild(i);
			child.reset();
			child.removeStyleHideAnswers();
			child.setWorkMode();
			child.setDisabled(module.isDisabled());
		}
		
		setState(this.currentState);
		this.isShowAnswersActive = false;
		
		view.refreshMath();
	}

	protected void setWorkMode() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		for(int i = 0; i < view.getChildrenCount(); i++) {
			view.getChild(i).setWorkMode();
		}
		
		this.isShowErrorsMode = false;
	}

	protected void setShowErrorsMode() {
		if (isShowAnswers()) {
			hideAnswers();
		}
		
		for(int i = 0; i < view.getChildrenCount(); i++) {
			view.getChild(i).setShowErrorsMode(module.isActivity());
		}
		
		this.isShowErrorsMode = true;
	}
	
	@Override
	public String getSerialId() {
		return module.getId();
	}

	@Override
	public String getState() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		HashMap<String, String> state = new HashMap<String, String>();
		state.put("gapUniqueId", module.getGapUniqueId());
		state.put("values", JSONUtils.toJSONString(values));
		
		if (enteredText != null) {
			state.put("enteredText", enteredText);
		}

		HashMap<String, String> itemsState = new HashMap<String, String>();
		for (String key : consumedItems.keySet()) {
			if (consumedItems.get(key) != null) {
				itemsState.put(key, consumedItems.get(key).toString());
			}
		}
		state.put("consumed", JSONUtils.toJSONString(itemsState));
		
		ArrayList<Boolean> stateDisabled = new ArrayList<Boolean>();
		for (int i = 0; i < view.getChildrenCount(); i++) {
			stateDisabled.add(view.getChild(i).isDisabled());
		}
		state.put("disabled", JSONUtils.toJSONString(stateDisabled));
		state.put("isVisible", Boolean.toString(isVisible));
		
		return JSONUtils.toJSONString(state);
	}


	/**
	 * Gap will have different id since it is randomly generated.
	 */
	@Override
	public void setState(String stateObj) {
		HashMap<String, String> state = JSONUtils.decodeHashMap(stateObj);
		
		String oldGapId = state.get("gapUniqueId") + "-";
		values.clear();
		HashMap<String, String> oldValues = JSONUtils.decodeHashMap(state.get("values"));
		for (String key : oldValues.keySet()) {
			String newKey = key.replace(oldGapId, module.getGapUniqueId()+"-");
			values.put(newKey, oldValues.get(key));
		}
		if (state.containsKey("enteredText")) {
			enteredText = state.get("enteredText");
			view.setHTML(enteredText);
		}
		consumedItems = new HashMap<String, DraggableItem>();
		HashMap<String, String> itemsState = JSONUtils.decodeHashMap(state.get("consumed"));
		for (String key: itemsState.keySet()) {
			String value = itemsState.get(key);
			String newKey = key.replace(oldGapId, module.getGapUniqueId()+"-");
			consumedItems.put(newKey,  DraggableItem.createFromString(value));
		}
		
		for (String id : values.keySet()) {
			String value = values.get(id);
			if (module.hasMathGaps() && !isShowAnswersActive) {
				module.parsedText = module.parsedText.replace("{{value:" + id + "}}", value);
			} else if (module.hasMathGaps()) {
				InputElement elem = DOM.getElementById(id).cast();
				elem.setValue(value);
			} else {
				view.setValue(id, value);
			}
		}
		
		ArrayList<Boolean> stateDisabled = JSONUtils.decodeArray(state.get("disabled"));
		for (int i = 0; i < view.getChildrenCount() && i < stateDisabled.size(); i++) {
			view.getChild(i).setDisabled(stateDisabled.get(i));
		}
		
		savedDisabledState = stateDisabled;
		
		if (module.hasMathGaps() && !isShowAnswersActive) {
			view.setHTML(module.parsedText);
		} 
		
		isVisible = Boolean.parseBoolean(state.get("isVisible"));
		
		if (isVisible) {
			view.show(false);
		} else {
			view.hide();
		}
	}
	
	
	@Override
	public int getErrorCount() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		String enteredValue;
		int errorCount = 0;
		
		if (module.isActivity()) {
		
			for (GapInfo gap : module.getGapInfos()) {
				enteredValue = getElementText(gap.getId()).trim();
				if (!enteredValue.isEmpty() && !gap.isCorrect(enteredValue)) {
					errorCount++;
				}
			}
	
			for(InlineChoiceInfo choice : module.getChoiceInfos()) {
				enteredValue = getElementText(choice.getId());
				
				if (!enteredValue.isEmpty() &&
					choice.getAnswer().compareToIgnoreCase(enteredValue) != 0 &&
					!enteredValue.equals("---"))
				{
					errorCount++;
				}
			}
		}
		
		return errorCount;
	}

	
	protected void reset() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if (module.isVisible())
			view.show(true);
		else
			view.hide();
		
		for (int i = 0; i < view.getChildrenCount(); i++) {
			TextElementDisplay child = view.getChild(i);
			child.reset();
			child.removeStyleHideAnswers();
			child.setDisabled(module.isDisabled());
		}

		if (enteredText != null) {
			updateViewText();
		}
		
		view.refreshMath();
		enteredText = null;
		draggableItem = null;
		consumedItems.clear();
		values.clear();
		updateScore();
		
		this.currentState = "";
	}


	@Override
	public int getMaxScore() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		int maxScore = 0;
		
		if (module.isActivity()) {
			for (GapInfo gap : module.getGapInfos()) {
				maxScore += gap.getValue();
			}
			for (InlineChoiceInfo choice : module.getChoiceInfos()) {
				maxScore += choice.getValue();
			}
		}
		
		return maxScore;
	}

	@Override
	public int getScore() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		int score = 0;

		if (module.isActivity()) {

			String enteredValue;
		
			for (GapInfo gap : module.getGapInfos()) {
				enteredValue = getElementText(gap.getId());
				if(gap.isCorrect(enteredValue)){
					score += gap.getValue();
				}
			}
	
			for (InlineChoiceInfo choice : module.getChoiceInfos()) {
				enteredValue = getElementText(choice.getId());
				if (choice.getAnswer().compareToIgnoreCase(enteredValue) == 0) {
					score += choice.getValue();
				}
			}
		}
		
		return score;
	}

	private String getElementText(String id) {
		String enteredValue;
		enteredValue = values.get(id);
		if(enteredValue == null) {
			enteredValue = "";
		}
		
		return enteredValue.trim();
	}

	@Override
	public void addView(IModuleView display) {

		if (display instanceof IDisplay) {
			view = (IDisplay) display;
			connectViewListener();
			updateViewText();
		}
		
		if (display instanceof TextView && module.hasMathGaps()) {
			String gapUniqueId = module.getGapUniqueId();
			for (int i = 1; i <= module.getGapInfos().size(); i++) {
				connectGapWhenMathJaxReady(this, gapUniqueId + '-' + Integer.toString(i));
			}
		}
	}

	private void updateViewText() {
		view.setHTML(module.getParsedText());
		if (module.hasDraggableGaps()) {
			view.connectDraggableGaps(module.getGapInfos().iterator());
		}
		else if (!module.hasMathGaps()) {
			view.connectGaps(module.getGapInfos().iterator());
		}
		view.connectFilledGaps(module.getGapInfos().iterator());
		view.connectInlineChoices(module.getChoiceInfos().iterator());
		view.connectLinks(module.getLinkInfos().iterator());
	}

	private void connectViewListener() {
		view.addListener(new ITextViewListener() {
			public void onValueChanged(String id, String newValue) {
				valueChanged(id, newValue);
			}
			
			public void onValueEdited(String id, String newValue) {
				valueEdited(id, newValue);
			}
			
			public void onLinkClicked(LinkType type, String link, String target) {
				if (type == LinkType.PAGE) {
					gotoPage(link);
				} else if (type == LinkType.DEFINITION) {
					showDefinition(link);
				} else { //for external links
					Window.open(link, target, null);
				}
			}
			
			public void onGapClicked(String gapId) {
				gapClicked(gapId);
			}
			
			public void onGapFocused(String gapId, Element element) {
				gapFocused(gapId, element);
			}
			
			public void onGapBlured(String gapId, Element element) {
				gapBlured(gapId, element);
			}

			@Override
			public void onDropdownClicked(String id) {
				dropdownClicked(id);
				
			}
		});
	}

	protected void dropdownClicked(String id) {
		ValueChangedEvent valueEvent = new ValueChangedEvent(module.getId(), "", "dropdownClicked", "");
		playerServices.getEventBus().fireEvent(valueEvent);
	}
	
	protected void valueChanged(String id, String newValue) {
		GapInfo gap = getGapInfoById(id);
		if (newValue == gap.getPlaceHolder()) {
			newValue = "";
		}
		values.put(id, newValue);
		updateScore();
		
		String score = Integer.toString(getItemScore(id));
		String itemID = id.substring(id.lastIndexOf("-")+1);
		ValueChangedEvent valueEvent = new ValueChangedEvent(module.getId(), itemID, newValue, score);
		playerServices.getEventBus().fireEvent(valueEvent);
	}
	
	protected void valueEdited(String id, String newValue) {
		values.put(id, newValue);
		updateScore();
	}

	protected void gotoPage(String pageName) {
		IPlayerCommands commands = playerServices.getCommands();
		commands.gotoPage(pageName);
	}

	protected void showDefinition(String word) {
		DefinitionEvent event = new DefinitionEvent(word);
		playerServices.getEventBus().fireEvent(event);
	}

	protected void gapClicked(String gapId) {
		
		DraggableItem previouslyConsumedItem = consumedItems.get(gapId);
		
		String value = "";
		String score = "0";
		String itemID = gapId.substring(gapId.lastIndexOf("-") + 1);
		if (previouslyConsumedItem != null) {
			consumedItems.remove(gapId);
			values.remove(gapId);
			view.setValue(gapId, "");
			fireItemReturnedEvent(previouslyConsumedItem);
			ValueChangedEvent valueEvent = new ValueChangedEvent(module.getId(), itemID, value, score);
			playerServices.getEventBus().fireEvent(valueEvent);
		} else if (draggableItem != null) {
			value = StringUtils.removeAllFormatting(draggableItem.getValue());
			view.setValue(gapId, draggableItem.getValue());
			view.refreshMath();
			consumedItems.put(gapId, draggableItem);
			values.put(gapId, value);
			fireItemConsumedEvent();
			score = Integer.toString(getItemScore(gapId));
			ValueChangedEvent valueEvent = new ValueChangedEvent(module.getId(), itemID, value, score);
			playerServices.getEventBus().fireEvent(valueEvent);
		}
		
	}
	
	protected void gapFocused(String gapId, Element element) {
		InputElement input = InputElement.as(element);
		GapInfo gap = getGapInfoById(gapId);
		String enteredValue = input.getValue();
		if (enteredValue == "") {
			input.setValue(gap.getPlaceHolder());
		}
	}
	
	protected void gapBlured(String gapId, Element element) {
		InputElement input = InputElement.as(element);
		GapInfo gap = getGapInfoById(gapId);
		String enteredValue = input.getValue();
		if (enteredValue == gap.getPlaceHolder()) {
			input.setValue("");
		}
	}
	
	private GapInfo getGapInfoById(String gapId) {
		GapInfo gap = gapInfos.get(gapId);
		if (gap == null) {
			gap = new GapInfo("stub", 0, false, false, 0);
			for (GapInfo gap1 : module.getGapInfos()) {
				if (gap1.getId().compareTo(gapId) == 0) {
					gap = gap1;
					break;
				}
			}
			gapInfos.put(gapId, gap);
		}
		return gap;
	}

	private void fireItemReturnedEvent(DraggableItem previouslyConsumedItem) {
		ItemReturnedEvent event = new ItemReturnedEvent(previouslyConsumedItem);
		playerServices.getEventBus().fireEvent(event);
	}

	private void fireItemConsumedEvent() {
		ItemConsumedEvent event = new ItemConsumedEvent(draggableItem);
		playerServices.getEventBus().fireEventFromSource(event, this);
	}

	private void updateScore() {
		IScoreService scoreService = playerServices.getScoreService();
		scoreService.setScore(module.getId(), getScore(), getMaxScore());
	}

	@Override
	public String getName() {
		return module.getId();
	}

	@Override
	public String executeCommand(String commandName, List<IType> params) {
		
		IStringType param = null;
		
		if (commandName.compareTo("settext") == 0 && params.size() > 0) {
			if (params.size() > 0 && params.get(0) instanceof IStringType) {
				param = (IStringType) params.get(0);
				setText(param.getValue());
			}
		} else if (commandName.compareTo("gettext") == 0 && params.size() > 0) {
			return view.getHTML();
		} else if (commandName.compareTo("enablegap") == 0 && params.size() == 1) {
			if (params.size() > 0 && params.get(0) instanceof IStringType) {
				param = (IStringType) params.get(0);
				int gapIndex = Integer.parseInt(param.getValue());
				enableGap(gapIndex);
			}
		} else if (commandName.compareTo("enableallgaps") == 0) {
            enableAllGaps();
        } else if (commandName.compareTo("disablegap") == 0 && params.size() == 1) {
			if (params.size() > 0 && params.get(0) instanceof IStringType) {
				param = (IStringType) params.get(0);
				int gapIndex = Integer.parseInt(param.getValue());
				disableGap(gapIndex);
			}
		} else if (commandName.compareTo("disableallgaps") == 0) {
            disableAllGaps();
        } else if (commandName.compareTo("show") == 0) {
			show();
		} else if (commandName.compareTo("hide") == 0) {
			hide();
		} else if (commandName.compareTo("reset") == 0) {
			reset();
		} else if (commandName.compareTo("isallok") == 0) {
            return String.valueOf(isAllOK());
        }
		
		return "";
	}
	
	private int getItemScore(String itemID) {
		int score = 0;

		GapInfo gap = getGapInfoById(itemID);
		String enteredValue = getElementText(gap.getId());
		if (enteredValue == gap.getPlaceHolder()) {
			enteredValue = "";
		}
		if (gap.isCorrect(enteredValue)) {
			score = gap.getValue();
		}

		for (InlineChoiceInfo choice : module.getChoiceInfos()) {
			if (choice.getId().compareTo(itemID) == 0) {
				String enteredChoiceValue = getElementText(choice.getId());
				if (module.isCaseSensitive()) {
					if (choice.getAnswer().compareTo(enteredChoiceValue) == 0) {
						score = choice.getValue();
					}
				} else {
					if(choice.getAnswer().compareToIgnoreCase(enteredChoiceValue) == 0) {
						score = choice.getValue();
					}
				}
				break;
			}
		}
		
		return score;
	}

	@Override
	public IModuleModel getModel() {
		return module;
	}
	
	public JavaScriptObject getAsJavaScript() {
		if (jsObject == null) {
			jsObject = initJSObject(this);
		}

		return jsObject;
	}

	
	private native JavaScriptObject initJSObject(TextPresenter x) /*-{
	
		var presenter = function() {};
			
		presenter.getGapText = function(gapId){ 
			return x.@com.lorepo.icplayer.client.module.text.TextPresenter::getGapText(I)(gapId);
		};
			
		presenter.getGapValue = function(gapId){ 
			return x.@com.lorepo.icplayer.client.module.text.TextPresenter::getGapText(I)(gapId);
		};
	
		presenter.isGapAttempted = function(gapId){ 
			return x.@com.lorepo.icplayer.client.module.text.TextPresenter::isGapAttempted(I)(gapId);
		};
			
		presenter.markGapAsCorrect = function(gapId){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::markGapAsCorrect(I)(gapId);
		};
			
		presenter.markGapAsWrong = function(gapId){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::markGapAsWrong(I)(gapId);
		};
			
		presenter.markGapAsEmpty = function(gapId){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::markGapAsEmpty(I)(gapId);
		};
			
		presenter.enableGap = function(gapId){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::enableGap(I)(gapId);
		};

		presenter.enableAllGaps = function(){
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::enableAllGaps()();
		};
			
		presenter.disableGap = function(gapId){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::disableGap(I)(gapId);
		};

		presenter.disableAllGaps = function(){
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::disableAllGaps()();
		};
			
		presenter.setText = function(text){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::setText(Ljava/lang/String;)(text.toString());
		};
			
		presenter.show = function(){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::show()();
		};
			
		presenter.hide = function(){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::hide()();
		};
		
		presenter.reset = function(){ 
			x.@com.lorepo.icplayer.client.module.text.TextPresenter::reset()();
		};

        var isActivity = x.@com.lorepo.icplayer.client.module.text.TextPresenter::isActivity()();

        if (isActivity) {
            presenter.isAttempted = function(){
                return x.@com.lorepo.icplayer.client.module.text.TextPresenter::isAttempted()();
            };
        }

		presenter.getView = function() { 
			return x.@com.lorepo.icplayer.client.module.text.TextPresenter::getView()();
		};

		presenter.isAllOK = function() {
			return x.@com.lorepo.icplayer.client.module.text.TextPresenter::isAllOK()();
		};
		
		return presenter;
	}-*/;
	
	private native void connectGapWhenMathJaxReady(TextPresenter x, String id) /*-{
		try {
			var hook = $wnd.MathJax.Hub.Register.MessageHook("End Process", function () {
				var dfd = $wnd.$.Deferred(),
					element = $wnd.$('#' + id);
				var checkSelector = setInterval(function () {
					if (element.length) {
						dfd.resolve(element);
						clearInterval(checkSelector);
					}
				}, 100);
				
				dfd.promise().done(function (_element) {
					console.log("created");
					x.@com.lorepo.icplayer.client.module.text.TextPresenter::connectMathGap(Ljava/lang/String;)(id);
					$wnd.MathJax.Hub.signal.hooks["End Process"].Remove(hook);
				});
			});
		} catch(err) {
			console.log("Error : " + err);
		}
	}-*/;
	
	private void connectMathGap(String id) {
		view.connectMathGap(module.getGapInfos().iterator(), id, savedDisabledState);
	}
	
	private Element getView(){
		if (isShowAnswers()) {
			hideAnswers();
		}

		return view.getElement();
	}
	
	private String getGapText(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}
		
		if(view != null && index <= view.getChildrenCount()){
			return view.getChild(index-1).getTextValue();
		}
		
		return "[error]";
	}
	
	private boolean isGapAttempted(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}
		
		if(view != null && index <= view.getChildrenCount()){
			return view.getChild(index-1).isAttempted();
		}
		
		return false;
	}
	
	private void markGapAsCorrect(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if (view != null && index <= view.getChildrenCount()) {
			view.getChild(index-1).markGapAsCorrect();
		}
	}
	
	private void markGapAsWrong(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(view != null && index <= view.getChildrenCount()) {
			view.getChild(index-1).markGapAsWrong();
		}
	}	
	
	private void markGapAsEmpty(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(view != null && index <= view.getChildrenCount()) {
			view.getChild(index-1).markGapAsEmpty();
		}
	}
	
	private void enableGap(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(view != null && index <= view.getChildrenCount()){
			view.getChild(index-1).setDisabled(false);
		}
	}

	private void enableAllGaps() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		for (int index = 0; index < view.getChildrenCount(); index++) {
			view.getChild(index).setDisabled(false);
		}
	}


	private void disableGap(int index) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(view != null && index <= view.getChildrenCount()){
			view.getChild(index-1).setDisabled(true);
		}
	}

	private void disableAllGaps() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		for (int index = 0; index < view.getChildrenCount(); index++) {
			view.getChild(index).setDisabled(true);
		}
	}

    private boolean isActivity () {
    	if (isShowAnswers()) {
			hideAnswers();
		}

        return module.isActivity();
    }

	private boolean isAttempted() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		boolean isAllAttempted = true;
		for (int index = 0; index < view.getChildrenCount(); index++) {
			if (!view.getChild(index).isAttempted()) {
				isAllAttempted = false;
			}

		}
		return isAllAttempted;
	}


	private void setText(String text) {
		if (isShowAnswers()) {
			hideAnswers();
		}

		enteredText = text;
		view.setHTML(text);
	}

	private void show() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		isVisible = true;
		if(view != null) {
			view.show(true);
		}
	}
	
	private void hide() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		isVisible = false;
		if(view != null) {
			view.hide();
		}
	}

	public boolean isAllOK() {
		return getScore() == getMaxScore() && getErrorCount() == 0;
	}

}
