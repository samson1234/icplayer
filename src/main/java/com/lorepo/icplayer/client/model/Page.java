package com.lorepo.icplayer.client.model;

import java.util.ArrayList;
import java.util.List;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.xml.client.Element;
import com.google.gwt.xml.client.Node;
import com.google.gwt.xml.client.NodeList;
import com.lorepo.icf.properties.BasicPropertyProvider;
import com.lorepo.icf.properties.IBooleanProperty;
import com.lorepo.icf.properties.IEnumSetProperty;
import com.lorepo.icf.properties.IImageProperty;
import com.lorepo.icf.properties.IProperty;
import com.lorepo.icf.utils.StringUtils;
import com.lorepo.icf.utils.URLUtils;
import com.lorepo.icf.utils.UUID;
import com.lorepo.icf.utils.XMLUtils;
import com.lorepo.icf.utils.i18n.DictionaryWrapper;
import com.lorepo.icplayer.client.framework.module.IStyleListener;
import com.lorepo.icplayer.client.framework.module.IStyledModule;
import com.lorepo.icplayer.client.module.ModuleFactory;
import com.lorepo.icplayer.client.module.api.IModuleModel;
import com.lorepo.icplayer.client.module.api.player.IPage;
import com.lorepo.icplayer.client.module.api.player.IPlayerServices;
import com.lorepo.icplayer.client.module.checkbutton.CheckButtonModule;
import com.lorepo.icplayer.client.utils.ModuleFactoryUtils;

public class Page extends BasicPropertyProvider implements IStyledModule, IPage {

	private IPlayerServices playerServices;
	public enum LayoutType {
		percentage,
		pixels,
		responsive
	}

	public enum ScoringType {
		percentage,
		zeroOne,
		minusErrors
	}

	private String id;
	private String name;
	private final String href;
	private LayoutType layout = LayoutType.pixels;
	private ScoringType scoringType = ScoringType.percentage;
	private String cssClass = "";
	private String inlineStyles = "";
	private final ModuleList modules = new ModuleList();
	/** base url to this document with ending '/' */
	private String baseURL = "";
	private IStyleListener styleListener;
	private boolean loaded = false;
	private int width;
	private int height;
	private boolean reportable = true;
	private String previewURL = "";
	// Properties
	IProperty propertyName;
	private int index;

	public Page(String name, String url) {
		super("Page");
		this.id = UUID.uuid(6);
		this.name = name;
		this.href = url;
		addPropertyName();
		addPropertyWidth();
		addPropertyHeight();
		addPropertyReportable();
		addPropertyPreview();
		addPropertyScoreType();
	}

	public void setPlayerServices(IPlayerServices ps) {
		this.playerServices = ps;
	}

	@Override
	public String getBaseURL(){
		return baseURL;
	}

	/**
	 * @return Pobranie linku względnego do strony.
	 */
	@Override
	public String getHref() {
		return href;
	}

	@Override
	public String getURL() {
		return URLUtils.resolveURL(baseURL, href);
	}

	public LayoutType getLayout() {
		return layout;
	}

	public ScoringType getScoringType() {
		return scoringType;
	}

	@Override
	public String getName() {
		return name;
	}

	public boolean isLoaded() {
		return loaded;
	}

	public void release() {
		for (IModuleModel module : modules) {
			module.release();
		}
		loaded = false;
	}

	@Override
	public String toString(){
		return "ID: " + name + ", href: " + href + " modules#: " + modules.size();
	}

	public void setName(String name) {
		this.name = name;
		sendPropertyChangedEvent(propertyName);
	}

	/**
	 * Ustawienie sposobu layoutowania strony
	 * @param pos
	 */
	public void setLayout(LayoutType newLayout) {
		layout = newLayout;
	}

	/**
	 * Serialize page to XML format
	 * @param includeAll - If true save name and isReportable property
	 */
	@Override
	public String toXML() {

		String xml = "<?xml version='1.0' encoding='UTF-8' ?>";

		xml += "<page layout='" + layout.toString() + "'";
		xml += " name='" + StringUtils.escapeXML(name) + "'";
		xml += " isReportable='" + reportable + "'";
		xml += " scoring='" + scoringType + "'";
		xml += " width='" + width + "'";
		xml += " height='" + height + "'";
		if(!cssClass.isEmpty()){
			String encodedClass = StringUtils.escapeXML(cssClass);
			xml += " class='" + encodedClass + "'";
		}
		if(!inlineStyles.isEmpty()){
			String encodedStyle = StringUtils.escapeXML(inlineStyles);
			xml += " style='" + encodedStyle + "'";
		}

		xml += ">";

		xml += "<modules>";

		for(IModuleModel module : modules){
			xml += module.toXML();
		}

		xml += 	"</modules>" + "</page>";

		return XMLUtils.removeIllegalCharacters(xml);
	}

	public void reload(Element rootElement) {
		load(rootElement, baseURL);
		String rawName = XMLUtils.getAttributeAsString(rootElement, "name");
        name = StringUtils.unescapeXML(rawName);
		reportable = XMLUtils.getAttributeAsBoolean(rootElement, "isReportable");
	}

	@Override
	public void load(Element rootElement, String url) {
		modules.clear();
		baseURL = url.substring(0, url.lastIndexOf("/") + 1);

		loadPageAttributes(rootElement);
		loadModules(rootElement);
		loaded = true;
	}

	private void loadPageAttributes(Element rootElement) {

		width = XMLUtils.getAttributeAsInt(rootElement, "width");
		height = XMLUtils.getAttributeAsInt(rootElement, "height");
		String style = StringUtils.unescapeXML(rootElement.getAttribute("style"));
		String css = URLUtils.resolveCSSURL(baseURL, style);
		setInlineStyle(css);
		setStyleClass(rootElement.getAttribute("class"));

		String positioning = rootElement.getAttribute("layout");
		if (positioning == null || positioning.isEmpty()) {
			setLayout(LayoutType.percentage);
		} else if (positioning.equals(LayoutType.responsive.toString())) {
			setLayout(LayoutType.responsive);
		} else {
			setLayout(LayoutType.pixels);
		}

		String scoring = XMLUtils.getAttributeAsString(rootElement, "scoring");
		setScoreFromString(scoring);
	}

	private void loadModules(Element rootElement) {

		ModuleFactory moduleFactory = new ModuleFactory(null);
		Element modulesNode = (Element)rootElement.getElementsByTagName("modules").item(0);
		NodeList moduleNodeList = modulesNode.getChildNodes();

		for(int i = 0; i < moduleNodeList.getLength(); i++) {
			Node node = moduleNodeList.item(i);

			if(node instanceof Element){
				IModuleModel module = moduleFactory.createModel(node.getNodeName());

				if(module != null){
					module.load((Element) node, getBaseURL());

					if(ModuleFactoryUtils.isCheckAnswersButton(module)) {
						module = new CheckButtonModule();
						module.load((Element) node, getBaseURL());
					};

					this.modules.add(module);
				}
			}
		}
	}


	private void addPropertyName() {

		propertyName = new IProperty() {

			@Override
			public void setValue(String newValue) {
				name = newValue;
				sendPropertyChangedEvent(this);
			}

			@Override
			public String getValue() {
				return name;
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("name");
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("name");
			}
		};

		addProperty(propertyName);
	}


	private void addPropertyWidth() {

		IProperty property = new IProperty() {

			@Override
			public void setValue(String newValue) {
				try {
					width = Integer.parseInt(newValue);
				} catch(NumberFormatException e) {
					width = 0;
				}
				sendPropertyChangedEvent(this);
			}

			@Override
			public String getValue() {
				return width > 0 ? Integer.toString(width) : "";
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("width");
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("width");
			}
		};

		addProperty(property);
	}


	private void addPropertyHeight() {

		IProperty property = new IProperty() {

			@Override
			public void setValue(String newValue) {
				try {
					height = Integer.parseInt(newValue);
				} catch (NumberFormatException e) {
					height = 0;
				}
				sendPropertyChangedEvent(this);
			}

			@Override
			public String getValue() {
				return height > 0 ? Integer.toString(height) : "";
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("height");
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("height");
			}
		};

		addProperty(property);
	}


	private void addPropertyReportable() {

		IBooleanProperty property = new IBooleanProperty() {

			@Override
			public void setValue(String newValue) {
				boolean value = (newValue.compareToIgnoreCase("true") == 0);

				if (value != reportable) {
					reportable = value;
					sendPropertyChangedEvent(this);
				}
			}

			@Override
			public String getValue() {
				return reportable ? "True" : "False";
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("is_reportable");
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("is_reportable");
			}
		};

		addProperty(property);
	}


	private void addPropertyPreview() {

		propertyName = new IImageProperty() {

			@Override
			public void setValue(String newValue) {
				previewURL = newValue;
				sendPropertyChangedEvent(this);
			}

			@Override
			public String getValue() {
				return previewURL;
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("Preview");
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("Preview");
			}
		};

		addProperty(propertyName);
	}


	@Override
	public void addStyleListener(IStyleListener listener) {
		styleListener = listener;
	}

	@Override
	public String getInlineStyle() {
		return inlineStyles;
	}

	@Override
	public String getStyleClass() {
		return cssClass;
	}

	@Override
	public void setInlineStyle(String inlineStyle) {

		if(inlineStyle != null){
			this.inlineStyles = inlineStyle;
			if(styleListener != null){
				styleListener.onStyleChanged();
			}
		}
	}


	@Override
	public void setStyleClass(String styleClass) {

		if(styleClass != null){
			this.cssClass = styleClass;

			if(styleListener != null){
				styleListener.onStyleChanged();
			}
		}
	}


	@Override
	public String getClassNamePrefix() {
		return "page";
	}

	public ModuleList getModules() {
		return modules;
	}

	@Override
	public List<String> getModulesList() {
		List<String> ids = new ArrayList<String>();
		for(IModuleModel module : modules) {
			ids.add(module.getId());
		}

		return ids;
	}

	public int getWidth() {
		return width;
	}


	public int getHeight() {
		return height;
	}


	public void setReportable(boolean reportable){
		this.reportable = reportable;
	}

	@Override
	public boolean isReportable(){
		return reportable;
	}

	public String createUniquemoduleId(String baseName) {
		String name;

		for(int i = 1; i < 100; i++) {

			name = baseName + i;
			if( modules.getModuleById(name) == null ){
				return name;
			}
		}

		return baseName + "_new";
	}


	public void outstreachHeight(int position, int amount) {

		int visibleHeight = getHeight() - amount;
		for(IModuleModel module : getModules()){
			if(module.getTop() > position && module.getTop() < visibleHeight){
				module.disableChangeEvent(true);
				module.setTop(module.getTop()+amount);
				module.disableChangeEvent(false);
			}
		}
	}


	@Override
	public String getPreview() {
		return previewURL;
	}


	public void setPreview(String preview) {
		this.previewURL = preview;
	}

	@Override
	public String getId() {
		return id;
	}

	public void setId(String pageId) {
		this.id = pageId;
	}

	public void setHeight(int height) {
		this.height = height;
	}

	private void addPropertyScoreType() {

		IProperty property = new IEnumSetProperty() {

			@Override
			public void setValue(String newValue) {
				setScoreFromString(newValue);
				sendPropertyChangedEvent(this);
			}

			@Override
			public String getValue() {
				return scoringType.toString();
			}

			@Override
			public String getName() {
				return DictionaryWrapper.get("score_type");
			}

			@Override
			public int getAllowedValueCount() {
				return ScoringType.values().length;
			}

			@Override
			public String getAllowedValue(int index) {
				return ScoringType.values()[index].toString();
			}

			@Override
			public String getDisplayName() {
				return DictionaryWrapper.get("score_type");
			}
		};

		addProperty(property);
	}

	private void setScoreFromString(String scoreName) {

		if(scoreName != null){
			for(ScoringType st : ScoringType.values()){
				if(st.toString().equals(scoreName)){
					scoringType = st;
				}
			}
		}
	}


	@Override
	public JavaScriptObject toJavaScript() {
		return javaScriptInterface(this);
	}

	/**
	 * Get JavaScript interface to the page
	 * @param x
	 * @return
	 */
	private native static JavaScriptObject javaScriptInterface(Page x) /*-{

		var page = function(){}
		page.type = "page";
		page.getId = function(){
			return x.@com.lorepo.icplayer.client.model.Page::getId()();
		}
		page.getName = function(){
			return x.@com.lorepo.icplayer.client.model.Page::getName()();
		}
		page.getBaseURL = function(){
			return x.@com.lorepo.icplayer.client.model.Page::getBaseURL()();
		}
		page.isReportable = function(){
			return x.@com.lorepo.icplayer.client.model.Page::isReportable()();
		}

		page.isVisited = function(){
			return x.@com.lorepo.icplayer.client.model.Page::isVisited()();
		}

		page.getModules = function() {
			return x.@com.lorepo.icplayer.client.model.Page::getModulesList()();
		}

		return page;
	}-*/;

	public boolean isVisited() {

		String pageId;
		int index = 0;

		int tocLength = playerServices.getModel().getPageCount();

		for (int i = 0; i < tocLength; i++) {
			if (playerServices.getModel().getPage(i).getId() == id) {
				index = i;
				break;
			}
		}

		if (playerServices.getCurrentPageIndex() == index) {
			return true;
		}

		pageId = playerServices.getModel().getPage(index).getId();
		return playerServices.getScoreService().getPageScoreById(pageId).hasScore();
	}
}
