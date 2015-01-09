package com.lorepo.icplayer.client.module.choice;

import java.util.HashMap;
import java.util.List;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.dom.client.Element;
import com.google.gwt.event.shared.EventBus;
import com.lorepo.icf.scripting.ICommandReceiver;
import com.lorepo.icf.scripting.IType;
import com.lorepo.icplayer.client.module.api.IActivity;
import com.lorepo.icplayer.client.module.api.IModuleModel;
import com.lorepo.icplayer.client.module.api.IModuleView;
import com.lorepo.icplayer.client.module.api.IPresenter;
import com.lorepo.icplayer.client.module.api.IStateful;
import com.lorepo.icplayer.client.module.api.event.CustomEvent;
import com.lorepo.icplayer.client.module.api.event.ResetPageEvent;
import com.lorepo.icplayer.client.module.api.event.ShowErrorsEvent;
import com.lorepo.icplayer.client.module.api.event.ValueChangedEvent;
import com.lorepo.icplayer.client.module.api.event.WorkModeEvent;
import com.lorepo.icplayer.client.module.api.player.IJsonServices;
import com.lorepo.icplayer.client.module.api.player.IPlayerServices;
import com.lorepo.icplayer.client.module.api.player.IScoreService;

public class ChoicePresenter implements IPresenter, IStateful, IOptionListener, IActivity, ICommandReceiver{

	public interface IOptionDisplay{
		public ChoiceOption getModel();
		void setDown(boolean down);
		boolean isDown();
		void setWrongStyle();
		void setCorrectStyle();
		void setCorrectAnswerStyle();
		void resetStyles();
		void setEventBus(EventBus eventBus);
		public void markAsCorrect();
		public void markAsEmpty();
		public void markAsWrong();
	}
	
	public interface IDisplay extends IModuleView{
		public List<IOptionDisplay> getOptions();
		public void setEnabled(boolean b);
		public void addListener(IOptionListener listener);
		public Element getElement();
		public void show();
		public void hide();
		public int[] getOryginalOrder();
		public void setVisibleVal(boolean val);
	}
	
	private IDisplay view;
	private ChoiceModel module;
	private IPlayerServices playerServices;
	private boolean isDisabled;
	private JavaScriptObject	jsObject;
	private boolean isVisible;
	private boolean isShowAnswersActive = false;
	private String currentState = "";
	

	public ChoicePresenter(ChoiceModel module, IPlayerServices services){
	
		this.module = module;
		this.playerServices = services;
		isDisabled = module.isDisabled();
		isVisible = module.isVisible();

		connectHandlers();
	}

	
	private void connectHandlers() {
		
		if (playerServices != null) {
			
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
	}
	
	private boolean isShowAnswers() {
		if (!module.isActivity()) {
			return false;
		}
		
		return this.isShowAnswersActive;
	}
	
	private void showAnswers() {
		if (!module.isActivity()) {
			return;
		}
		
		this.currentState = getState();
		this.isShowAnswersActive = true;

		clearStylesAndSelection();
		view.setEnabled(false);
		
		for(IOptionDisplay optionView : view.getOptions()){
			ChoiceOption option = optionView.getModel();
			
			if (option.getValue() > 0) {
				optionView.setDown(true);
				optionView.setCorrectAnswerStyle();
			} else {
				optionView.setWrongStyle();
			}
		}
		
	}
	
	private void hideAnswers() {
		if (!module.isActivity()) {
			return;
		}
		
		clearStylesAndSelection();
		setState(this.currentState);
		
		this.isShowAnswersActive = false;
		setWorkMode();
		
		this.currentState = "";
	}
	
	
	private void setShowErrorsMode() {
		if (isShowAnswers()) {
			hideAnswers();
		}
		
		if(module.isActivity()){
			for(IOptionDisplay optionView : view.getOptions()){
				ChoiceOption option = optionView.getModel();
				if (optionView.isDown()) {
					if(option.getValue() > 0){
						optionView.setCorrectStyle();
					} else{
						optionView.setWrongStyle();
					}
				} else {
					if (option.getValue() > 0) {
						optionView.setWrongStyle();
					} else {
						optionView.setCorrectStyle();
					}
				}
			}
		}
	
		view.setEnabled(false);
	}	
	
	private void setWorkMode() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(module.isActivity()){
			for(IOptionDisplay optionView : view.getOptions()){
				optionView.resetStyles();
			}
		}
			
		view.setEnabled(!isDisabled);
	}	
	
	
	private void reset() {
		if (isShowAnswers()) {
			hideAnswers();
		}
		
		if(module.isVisible()) show();
		else view.hide();

		clearStylesAndSelection();
		
		isDisabled = module.isDisabled();
		view.setEnabled(!isDisabled);
		if (module.isActivity()) {
			saveScore();
		}
	}


	private void clearStylesAndSelection() {
		for(IOptionDisplay optionView : view.getOptions()){
			optionView.setDown(false);
			optionView.resetStyles();
		}
	}


	@Override
	public String getSerialId() {
		return module.getId();
	}

	@Override
	public String getState() {
		if (isShowAnswers()) {
			return this.currentState;
		}

		IJsonServices json = playerServices.getJsonServices();
		HashMap<String, String> state = new HashMap<String, String>();
		String optionState = "";
		
		int[] oryginalOrder = view.getOryginalOrder();

		for(int i=0; i<oryginalOrder.length; i++){
			IOptionDisplay option = view.getOptions().get(oryginalOrder[i]);
			optionState += option.isDown() ? '1' : '0';
		}
		
		state.put("options", optionState);
		state.put("isDisabled", Boolean.toString(isDisabled));
		state.put("isVisible", Boolean.toString(isVisible));
		return json.toJSONString(state);
	}

	
	@Override
	public void setState(String stateObj) {
		IJsonServices json = playerServices.getJsonServices();
		HashMap<String, String> state = json.decodeHashMap(stateObj);
		if (state.containsKey("options")) {
			String optionState = state.get("options");
			int index = 0;
			
			int[] oryginalOrder = view.getOryginalOrder();
			for (int i=0; i<oryginalOrder.length; i++) {
				
				index = oryginalOrder[i];
				
				IOptionDisplay option = view.getOptions().get(index);
				
				if(optionState.length() < i+1){
					break;
				}
				
				boolean value = (optionState.charAt(i) == '1');
				option.setDown(value);
			}
		}

		if (state.containsKey("isDisabled")) {
			isDisabled = Boolean.parseBoolean(state.get("isDisabled"));
			view.setEnabled(!isDisabled);
		}

		if (state.containsKey("isVisible")) {
			isVisible = Boolean.parseBoolean(state.get("isVisible"));
			view.setVisibleVal(isVisible);
		}
	}


	private void enable() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		isDisabled = false;
		view.setEnabled(true);
	}


	private void disable() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		isDisabled = true;
		view.setEnabled(false);
	}


	@Override
	public void onValueChange(IOptionDisplay sourceOptionView, boolean selected) {

		if(!module.isMulti() && selected){
		
			for(IOptionDisplay optionView : view.getOptions()){
				if(optionView != sourceOptionView){
					optionView.setDown(false);
				}
			}
		}
		
		ChoiceOption option = sourceOptionView.getModel();
		String feedback = option.getFeedback();
		if(!feedback.isEmpty()){
			playerServices.getCommands().executeEventCode(feedback);
		}
		saveScore();
		
		String newValue = sourceOptionView.isDown()? "1" : "0";
		String id = option.getID();
		String score = "0";
		if(sourceOptionView.isDown()){
			score = Integer.toString(option.getValue());
		}
		ValueChangedEvent valueEvent = new ValueChangedEvent(module.getId(), id, newValue, score);
		playerServices.getEventBus().fireEvent(valueEvent);
		
		if(getScore() == getMaxScore() && getErrorCount() == 0){
			score = Integer.toString(getScore());
			valueEvent = new ValueChangedEvent(module.getId(), id, "allOK", score);
			playerServices.getEventBus().fireEvent(valueEvent);
		}
	}

	
	// ------------------------------------------------------------------------
	// IActivity
	// ------------------------------------------------------------------------
	@Override
	public int getErrorCount() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		int errors = 0;
		if(module.isActivity()){
			for(IOptionDisplay optionView : view.getOptions()){
				if(optionView.isDown() && optionView.getModel().getValue() == 0){
					errors++;
				}
			}
		}
		
		return errors;
	}


	@Override
	public int getMaxScore() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(module.isActivity()) return module.getMaxScore();
		else return 0;
	}

	@Override
	public int getScore() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		int score = 0;
		if(module.isActivity()){
			for(IOptionDisplay optionView : view.getOptions()){
				if(optionView.isDown()){
					score += optionView.getModel().getValue();
				}
			}
		}
		return score;
	}
	

	/**
	 * Update module score
	 * @param value
	 */
	void saveScore() {

		if(playerServices != null){
		
			IScoreService scoreService = playerServices.getScoreService();
			scoreService.setScore(module.getId(), 0, module.getMaxScore());
			int score = 0;
	
			for(IOptionDisplay optionView : view.getOptions()){
				if(optionView.isDown()){
					score += optionView.getModel().getValue();
				}
			}
			
			scoreService.setScore(module.getId(), score, module.getMaxScore());
		}
	}


	@Override
	public void addView(IModuleView display) {
		
		if(display instanceof IDisplay){
			view = (IDisplay) display;
			view.addListener(this);
			for(IOptionDisplay optionView : view.getOptions()){
				optionView.setEventBus(playerServices.getEventBus());
			}
		}
	}


	@Override
	public IModuleModel getModel() {
		return module;
	}

	@Override
	public String executeCommand(String commandName, List<IType> _) {
		
		if (commandName.compareTo("enable") == 0){
			enable();
		} else if (commandName.compareTo("disable") == 0){
			disable();
		} else if (commandName.compareTo("show") == 0){
			show();
		} else if (commandName.compareTo("hide") == 0){
			hide();
		} else if (commandName.compareTo("reset") == 0){
			reset();
		}
		
		return "";
	}

	@Override
	public String getName() {
		return module.getId();
	}

	public JavaScriptObject getAsJavaScript(){
		
		if(jsObject == null){
			jsObject = initJSObject(this);
		}

		return jsObject;
	}

	private native JavaScriptObject initJSObject(ChoicePresenter x) /*-{

		var presenter = function() {};

		presenter.disable = function() {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::disable()();
		}

		presenter.enable = function() {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::enable()();
		}

		presenter.show = function() {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::show()();
		}

		presenter.hide = function() {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::hide()();
		}

		presenter.reset = function() {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::reset()();
		}

		presenter.isAttempted = function() {
			return x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::isAttempted()();
		}

		presenter.getView = function() {
			return x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::getView()();
		}

		presenter.markOptionAsCorrect = function(index) {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::markOptionAsCorrect(I)(index);
		}

		presenter.markOptionAsWrong = function(index) {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::markOptionAsWrong(I)(index);
		}

		presenter.markOptionAsEmpty = function(index) {
			x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::markOptionAsEmpty(I)(index);
		}

		presenter.isOptionSelected = function(index) {
			return x.@com.lorepo.icplayer.client.module.choice.ChoicePresenter::isOptionSelected(I)(index);
		}

		return presenter;
	}-*/;
	
	private Element getView(){
		return view.getElement();
	}
	
	private void markOptionAsCorrect(int index){
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(index <= view.getOptions().size()){
			view.getOptions().get(index-1).markAsCorrect();
		}
	}
	
	private void markOptionAsWrong(int index){
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(index <= view.getOptions().size()){
			view.getOptions().get(index-1).markAsWrong();
		}
	}
	
	private void markOptionAsEmpty(int index){
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(index <= view.getOptions().size()){
			view.getOptions().get(index-1).markAsEmpty();
		}
	}
	
	private boolean isOptionSelected(int index){
		if (isShowAnswers()) {
			hideAnswers();
		}

		if(index <= view.getOptions().size()){
			return view.getOptions().get(index-1).isDown();
		}
		return false;
	}


	private void show(){
		if (isShowAnswers()) {
			hideAnswers();
		}

		isVisible = true;
		if(view != null){
			view.show();
		}
	}
	
	
	private void hide(){
		if (isShowAnswers()) {
			hideAnswers();
		}

		isVisible = false;
		if(view != null){
			view.hide();
		}
	}
	
	
	/**
	 * Check if module has any option selected 
	 */
	private boolean isAttempted() {
		if (isShowAnswers()) {
			hideAnswers();
		}

		for(IOptionDisplay optionView : view.getOptions()){
			if(optionView.isDown()){
				return true;
			}
		}
		
		return false;
	}


	@Override
	public void releaseMemory() {
		// TODO Auto-generated method stub
		
	}
}
