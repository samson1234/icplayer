package com.lorepo.icplayer.client.mockup.services;

import com.lorepo.icplayer.client.module.api.player.IPlayerCommands;
import com.lorepo.icplayer.client.module.api.player.PageScore;
import com.lorepo.icplayer.client.page.PageController;

public class CommandsMockup implements IPlayerCommands {

	private float score = 34;
	private float maxScore = 50;
	private int errorCount = 13;
	private String lastCode;
	
	private String command;
	
	@Override
	public void checkAnswers() {
	}

	@Override
	public void uncheckAnswers() {
	}

	@Override
	public void reset() {
	}

	@Override
	public PageScore getCurrentPageScore() {
		PageScore pageScore = new PageScore(score, maxScore, 0, errorCount, 0);
		return pageScore;
	}

	@Override
	public void showPopup(String pageName, String additionalClasses) {
	}

	@Override
	public void closePopup() {
	}

	@Override
	public void nextPage() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void prevPage() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void gotoPage(String name) {
		command = "gotoPage: " + name;
	}
	
	public String getCommand(){
		return command;
	}

	@Override
	public void executeEventCode(String code) {
		lastCode = code;
	}
	
	public String getLastCode(){
		return lastCode;
	}

	@Override
	public void updateCurrentPageScore() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public long getTimeElapsed() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public void gotoPageIndex(int index) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void gotoPageId(String pageId) {
		// TODO Auto-generated method stub
		
	}
	
	@Override
	public void sendPageAllOkOnValueChanged(boolean sendEvent) {
		// TODO Auto-generated method stub
	}

	@Override
	public PageController getPageController() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setNavigationPanelsAutomaticAppearance(boolean shouldAppear) {
		// TODO Auto-generated method stub
		
	}
	
	@Override
	public void showNavigationPanels() {
		// TODO Auto-generated method stub
		
	}
	
	@Override
	public void hideNavigationPanels() {
		// TODO Auto-generated method stub
		
	}
	
}
