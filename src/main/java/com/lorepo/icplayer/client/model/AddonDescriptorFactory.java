package com.lorepo.icplayer.client.model;

import java.util.Collection;
import java.util.HashMap;

import com.google.gwt.core.client.GWT;
import com.lorepo.icf.utils.i18n.DictionaryWrapper;

public class AddonDescriptorFactory {

	private static AddonDescriptorFactory theInstance = null;

	public static AddonDescriptorFactory getInstance(){
		if (theInstance == null) {
			theInstance = new AddonDescriptorFactory();
		}
		return theInstance;
	}

	private HashMap<String, AddonEntry>	addonList;

	public AddonDescriptorFactory() {
		registerLocalDescriptors();
	}

	/**
	 * Init list of local addons
	 */
	private void registerLocalDescriptors() {
		addonList = new HashMap<String, AddonEntry>();

		// ACTIVITIES
		addDescriptor("Basic_Math_Gaps", "activities_menu");
		addDescriptor("Clock", "activities_menu");
		addDescriptor("ConnectingDots", "activities_menu");
		addDescriptor("Connection", "activities_menu");
		addDescriptor("Count_and_Graph", "activities_menu");
		addDescriptor("crossword", "activities_menu");
		addDescriptor("Fractions", "activities_menu");
		addDescriptor("graph", "activities_menu");
		addDescriptor("Hangman", "activities_menu");
		addDescriptor("Image_Identification", "activities_menu");
		addDescriptor("Line_Number", "activities_menu");
		addDescriptor("Magic_Boxes", "activities_menu");
		addDescriptor("gamememo", "activities_menu");
		addDescriptor("Math", "activities_menu");
		addDescriptor("multiplegap", "activities_menu");
		addDescriptor("Paragraph", "activities_menu");
		addDescriptor("Paragraph_Keyboard", "activities_menu");
		addDescriptor("PieChart", "activities_menu");
		addDescriptor("Plot", "activities_menu");
		addDescriptor("Points_To_Plot", "activities_menu");
		addDescriptor("PointsLines", "activities_menu");
		addDescriptor("Puzzle", "activities_menu");
		addDescriptor("Sudoku", "activities_menu");
		addDescriptor("Table", "activities_menu");
		addDescriptor("text_identification", "activities_menu");
		addDescriptor("Text_Selection", "activities_menu");
		addDescriptor("TrueFalse", "activities_menu");
		addDescriptor("WritingCalculations", "activities_menu");

		// REPORTING
		addDescriptor("Animated_Lesson_Progress", "reporting_menu");
		addDescriptor("Animated_Page_Progress", "reporting_menu");
		addDescriptor("Completion_Progress", "reporting_menu");
		addDescriptor("Custom_Scoring", "reporting_menu");
		addDescriptor("Done", "reporting_menu");
		addDescriptor("Hierarchical_Lesson_Report", "reporting_menu");
		addDescriptor("Lesson_Error_Counter", "reporting_menu");
		addDescriptor("Lesson_Progress", "reporting_menu");
		addDescriptor("Lesson_Score_Counter", "reporting_menu");
		addDescriptor("Page_Rating", "reporting_menu");
		addDescriptor("Page_Score_Counter", "reporting_menu");
		addDescriptor("Show_Answers", "reporting_menu");
		addDescriptor("Submit", "reporting_menu");

		// NAVIGATION
		addDescriptor("External_Link_Button", "navigation_menu");
		addDescriptor("Navigation_Bar", "navigation_menu");
		addDescriptor("Next", "navigation_menu");
		addDescriptor("Page_Counter", "navigation_menu");
		addDescriptor("Page_Name", "navigation_menu");
		addDescriptor("Table_Of_Contents", "navigation_menu");

		// SCRIPTING
		addDescriptor("Viewer_3D", "media_menu");
		addDescriptor("Animation", "media_menu");
		addDescriptor("Audio", "media_menu");
		addDescriptor("Coloring", "media_menu");
		addDescriptor("Drawing", "media_menu");
		addDescriptor("EdgeAnimation", "media_menu");
		addDescriptor("Glossary", "media_menu");
		addDescriptor("Image_Viewer_Public", "media_menu");
		addDescriptor("Image_Viewer_Button_Controlled_Public", "media_menu");
		addDescriptor("IWB_Toolbar", "media_menu");
		addDescriptor("Layered_Image", "media_menu");
		addDescriptor("Line", "media_menu");
		addDescriptor("MultiAudio", "media_menu");
		addDescriptor("Shape_Tracing", "media_menu");
		addDescriptor("Slideshow", "media_menu");
		addDescriptor("Standard_Shapes", "media_menu");
		addDescriptor("SVG2", "media_menu");
		addDescriptor("SwiffyAnimation", "media_menu");
		addDescriptor("TextAudio", "media_menu");
		addDescriptor("video", "media_menu");
		addDescriptor("Vimeo", "media_menu");
		addDescriptor("YouTube_Addon", "media_menu");
		addDescriptor("Zoom_Image", "media_menu");

		// SCRIPTING
		addDescriptor("Advanced_Connector", "scripting_menu");
		addDescriptor("Connector", "scripting_menu");
		addDescriptor("Double_State_Button", "scripting_menu");
		addDescriptor("eKeyboard", "scripting_menu");
		addDescriptor("Event_Listener", "scripting_menu");
		addDescriptor("Event_Sender", "scripting_menu");
		addDescriptor("feedback", "scripting_menu");
		addDescriptor("Logger", "scripting_menu");
		addDescriptor("Multiple_Audio_Controls_Binder", "scripting_menu");
		addDescriptor("Single_State_Button", "scripting_menu");
		addDescriptor("Slider", "scripting_menu");
		addDescriptor("MenuPanel_dev", "scripting_menu");

		// LEARN PEN
		addDescriptor("LearnPen", "learn_pen_menu");
		//addDescriptor("LearnPen_Data", "learn_pen_menu");

	}

	private void addDescriptor(String id, String category) {
		String url = GWT.getModuleBaseURL() + "addons/" + id + ".xml";
		String name = DictionaryWrapper.get(id + "_name");

		AddonEntry entry = new AddonEntry(id, name, url, category);
		addonList.put(entry.getId(), entry);
	}

	public boolean isLocalAddon(String addonId) {
		return addonList.containsKey(addonId);
	}

	public AddonEntry getEntry(String addonId) {
		return addonList.get(addonId);
	}

	public Collection<AddonEntry> getEntries() {
		return addonList.values();
	}
}
