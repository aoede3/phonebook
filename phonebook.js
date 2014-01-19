/*
*	XHR and Dynamic XSLT Transformation
*	phonebook
* 	build 0.1 :: xx/xx/2009
*/
/* XHR Connector */
phonebookXMLReq = function() {
	this.adapter = false;
	/*@cc_on @*/
	/*@if (@_jscript_version >= 5)
		try {
			this.adapter = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				this.adapter = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (E) {
				this.adapter = false;
			}
		}
	@end @*/
	if (!this.adapter && typeof(XMLHttpRequest) != 'undefined') {
		this.adapter = new XMLHttpRequest();
	}
};
phonebookXMLReq.prototype.adapter = null;
phonebookXMLReq.prototype.getDocument = function(sUrl) {
	this.adapter.open("GET", sUrl, false);
	this.adapter.send(null);
	//alert("Status = " + this.adapter.status + "\n"+this.adapter.getAllResponseHeaders()+"\nParse Error = " +this.adapter.responseXML.parseError.errorCode);
	// XML sent as application/octet-stream!! so can't use responseXML in this instance
	return this.adapter.responseBody;
};
phonebookXSLProc = function() {};
//phonebookXSLProc.prototype._proc = null;
phonebookXSLProc.prototype.importStylesheet = function(XSL) {
	var xslDoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
	var xslTemplate = new ActiveXObject("Msxml2.XSLTemplate");
	xslDoc.async = false;
	xslDoc.loadXML(XSL);
	xslTemplate.stylesheet = xslDoc;
	this._proc = xslTemplate.createProcessor();
};
phonebookXSLProc.prototype.transformToFragment = function(xmlSource, domDocument) {
	if(xmlSource===null) {return "";}
		this._proc.input = xmlSource;
		this._proc.transform();
		var rawXML = this._proc.output;
		return rawXML;
};
phonebookXSLProc.prototype.getParameter = function(paramName, paramValue) {
	this._proc.getParameter(paramName, paramValue);

};
phonebookXSLProc.prototype.setParameter = function(namespace, paramName, paramValue) {
	if(document.implementation.createDocument) {
		this._proc.setParameter(namespace, paramName, paramValue);
	}else{
		this._proc.addParameter(paramName, paramValue);
	}
};

/*  Cor blimey - this'll be it then */
var phonebook = function() {};
var peoplefinder = new phonebook();
phonebook.prototype.tableBody = null;
phonebook.prototype.query = null;
phonebook.prototype.xslProc = null;
phonebook.prototype.xmlReq = null;
phonebook.prototype.data = null;
phonebook.prototype.init = function() {
	// init vars
	this.tableBody = getid("pf");
	this.d = ""
	this.t = ""
	this.fname = "";	
	this.lname = "";
	this.reportsto = "";
	this.directrep = "";	
	this.skill = "";
	this.type = "";	
	this.empid = "";
	this.xslProc = new phonebookXSLProc();
	this.xmlReq = new phonebookXMLReq();
	this.data = this.xmlReq.getDocument("phonebook.xml");
	this.generateXSL("","");
	this.sort(this.d,this.t,this.fname,this.lname,this.reportsto,this.directrep,this.skill,this.empid,this.type);
};

phonebook.prototype.sort = function(d,t,fname,lname,reportsto,directrep,skill,empid,type) {

	if(type!="org_chart"){
		// is t undefined? if so don't feed that into the XSL!!
		if (t===undefined){t="0"}

		this.xslProc.setParameter(null,"department",d);	
		this.xslProc.setParameter(null,"team",t);	
		this.xslProc.setParameter(null,"fname",fname);	
		this.xslProc.setParameter(null,"lname",lname);
		this.xslProc.setParameter(null,"reportsto",reportsto);
		this.xslProc.setParameter(null,"directrep",directrep);	
		this.xslProc.setParameter(null,"skill",skill);		

		// apply transform
		var fragment=this.xslProc.transformToFragment(this.data,document);
		if(fragment==="") {fragment="No data";}
		else {
			this.tableBody.innerHTML=fragment;
		}
		
		departmentfilter = new selectfilter(getid("department"),d);
		teamfilter = new selectfilter(getid("team"),t.split("|")[0]);

		//sort dropdowns with any previous values
		getid("department").value = d;
		teamfilter.set(getid("department").options[getid("department").selectedIndex].value.split("|")[0],"team","Select Team *",0);
		if (t!=0){getid("team").value = d+"|"+t;}else{getid("team").value=0;};
		getid("firstname").value = fname;	
		getid("lastname").value = lname;

		
	}else{
		this.generateXSL("","structure");
		this.xslProc.setParameter(null,"source",empid);
		var fragment=this.xslProc.transformToFragment(this.data,document);
		if(fragment==="") {fragment="No data";
		}else {
			this.tableBody.innerHTML=fragment;
		}
	}
};

phonebook.prototype.filter = function(q) {};
phonebook.prototype.generateXSL = function(query,type) {

	if(type==="structure"){
		var output ='<?xml version="1.0" encoding="UTF-8"?>';
			output += '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:v="urn:schemas-microsoft-com:vml">';
			//output += '	<!-- Set dynamic parameters-->';			
			output += '<xsl:param name="source"/>';

			output += '	<xsl:template name="getmanager">';
			output += '		<xsl:for-each select="colleagues/dept/team/col[@empid=$source]">';
			output += '		<xsl:sort select="@lname" order="ascending"/>';
			output += '			<xsl:call-template name="displaymanager">';
			output += '				<xsl:with-param name="repempid" select="@rep"/>';
			output += '			</xsl:call-template>';		
			output += '		</xsl:for-each>';
			output += '	</xsl:template>	';
	
			output += '	<xsl:template name="displaymanager">';
			output += '	<xsl:param name="repempid"/>';
			output += '		<xsl:for-each select="colleagues/dept/team/col[@empid=$repempid]">';
			output += '		<xsl:sort select="@lname" order="ascending"/>';
			//output += '		<v:roundrect>';
			//output += '			<v:textbox>';
			output += '				<center>';
			output += '					<a href="javascript:org_chart(\'{@empid}\')"><xsl:value-of select="@fname"/><xsl:text> </xsl:text><xsl:value-of select="@lname"/></a> <br/> ';
			output += '					<xsl:value-of select="@jobtitle"/>';
			output += '				</center>';
			//output += '			</v:textbox>';
			//output += '		</v:roundrect>';
			output += '		</xsl:for-each>';
			output += '	</xsl:template>';
	
			output += '	<xsl:template name="source">';
			output += '		<xsl:for-each select="colleagues/dept/team/col[@empid=$source]">';
			output += '		<xsl:sort select="@lname" order="ascending"/>';
			output += '			<xsl:call-template name="displaymanager">';
			output += '				<xsl:with-param name="empid" select="@empid"/>';
			output += '			</xsl:call-template>';
			
			//output += '			<v:roundrect>';
			//output += '				<v:textbox>';
			output += '					<center>';
			output += '						<xsl:value-of select="@fname"/><xsl:text> </xsl:text><xsl:value-of select="@lname"/> <br/>';
			output += '						<xsl:value-of select="@jobtitle"/><br/><xsl:value-of select="../@name"/>';
			//output += '						<br/><a class="view_details" title="View Details" href="javascript:showdetails(\'{@empid}\')">(view details)</a>';			
			output += '					</center>';
			//output += '				</v:textbox>';		
			//output += '			</v:roundrect>';	
			output += '		</xsl:for-each>';
			output += '	</xsl:template>	';
	
			output += '	<xsl:template name="directreps">';
			output += '		<xsl:for-each select="colleagues/dept/team/col[@rep=$source]">';
			output += '		<xsl:sort select="@lname" order="ascending"/>';
			output += '			<td valign="top" style="background: #d7e8e3;">';
			//output += '				<v:roundrect>';
			//output += '				<v:textbox>';
			output += '					<center>';
			output += '						<a href="javascript:org_chart(\'{@empid}\')"><xsl:value-of select="@fname"/><xsl:text> </xsl:text><xsl:value-of select="@lname"/></a> <br/> ';
			output += '						<xsl:value-of select="@jobtitle"/>';
			//output += '						<br/><a class="view_details" title="View Details" href="javascript:showdetails(\'{@empid}\')">(view details)</a>';
			output += '					</center>';
			//output += '				</v:textbox>';		
			//output += '				</v:roundrect>';		

			output += '				<xsl:call-template name="directrep">';
			output += '					<xsl:with-param name="empid" select="@empid"/>';
			output += '				</xsl:call-template><br/>';
			output += '			</td>';
			output += '		</xsl:for-each>';
			output += '	</xsl:template>';
	
			output += '	<xsl:template name="directrep">';
			output += '	<xsl:param name="empid"/>';
			output += '		<xsl:for-each select="colleagues/dept/team/col[@rep=$empid]">';
			output += '		<xsl:sort select="@lname" order="ascending"/>';
			output += '			<p style="text-align:center;">';
			output += '				<br/><xsl:value-of select="@fname"/><xsl:text> </xsl:text><xsl:value-of select="@lname"/> <br/>';
			output += '				<xsl:value-of select="@jobtitle"/> ';
			output += '			</p>		';
			output += '		</xsl:for-each>';
			output += '	</xsl:template>	';
			
			//output += '<!-- Main Template -->';
			output += '	<xsl:template match="/">';	
			output += '		<table class="org_chart_table">';
			output += '		<tr><td style="background: #99c6b8;">';
			//output += '		<!-- get the source persons immediate manager to display above them -->';			
			output += '			<xsl:call-template name="getmanager"/>';
			output += '		</td></tr>';
			output += '		</table>';
			
			output += '		<table class="org_chart_table">';
			output += '		<tr><td style="background: #bfdbd3;">';
			//output += '		<!-- Person who you've clicked on -->';			
			output += '			<xsl:call-template name="source"/>';
			output += '		</td></tr>';
			output += '		</table>';
			
			output += '		<table class="org_chart_table">';
			output += '		<tr>';
			//output += '		<!-- Direct Reports To source and their immediate reports-->';			
			output += '			<xsl:call-template name="directreps"/>';
			output += '		</tr>';
			output += '		</table>';	
			output += '		<p><a style="font-weight:normal;" title="Return To Phonebook" href="javascript:peoplefinder.init()">Return To Phonebook</a></p>';		
			output += '	</xsl:template>';
			output += '</xsl:stylesheet>';

	}else{

		var output = '<?xml version="1.0" encoding="UTF-8"?>';
			output += '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">';
			//output += '	<!-- Set dynamic parameters-->';	
			output += '	<xsl:param name="department"/>';
			output += '	<xsl:param name="team"/>';
			output += '	<xsl:param name="fname"/>';				
			output += '	<xsl:param name="lname"/>';		
			output += '	<xsl:param name="reportsto"/>';				
			output += '	<xsl:param name="directrep"/>';
			output += '	<xsl:param name="skill"/>';		
			output += '	<xsl:param name="empid"/>';				
			
			//output += '	<!-- Set static parameters-->';		
			output += ' <xsl:param name="lc" select="\'abcdefghijklmnopqrstuvwxyz\'" />';
			output += ' <xsl:param name="uc" select="\'ABCDEFGHIJKLMNOPQRSTUVWXYZ\'" />';
			
			//output += '	<!-- Set variables to pull unique values-->';
			output += '	<xsl:key name="department_id" match="/colleagues/dept" use="@name"/>';
			output += '	<xsl:variable name="department_areas" select="/colleagues/dept[generate-id(.)=generate-id(key(&#39;department_id&#39;,@name))]"/>';
			output += '	<xsl:key name="team_id" match="/colleagues/dept/team" use="@name"/>';
			output += '	<xsl:variable name="team_areas" select="/colleagues/dept/team[generate-id(.)=generate-id(key(&#39;team_id&#39;,@name))]"/>		';
			
			//output += '	<!-- Templates for dropdowns-->';
			output += '	<xsl:template name="selector">';
			output += '	<h2>Search by Department</h2>';		
			output += '		<select id="department" onFocus="cboReset()" onChange="teams();">';
			output += '		<option value="">Select Department</option>';
			output += '		<xsl:for-each select="$department_areas">';
			output += '		<xsl:sort select="@name" order="ascending"/>';
			output += '			<option>';
			output += '				<xsl:attribute name="value">';
			output += '					<xsl:value-of select="@did"/>';
			output += '				</xsl:attribute>';
			output += '				<xsl:value-of select="@name"/>';
			output += '			</option>';
			output += '		</xsl:for-each>';
			output += '		</select><br/>';

			output += '		<select id="team" onFocus="cboReset()">';
			output += '		<option value="">Select Team *</option>';
			output += '		<xsl:for-each select="$team_areas">';
			output += '		<xsl:sort select="@name" order="ascending"/>';
			output += '			<option>';
			output += '				<xsl:attribute name="value">';
			output += '					<xsl:value-of select="@did"/>|<xsl:value-of select="@tid"/>';
			output += '				</xsl:attribute>';
			output += '				<xsl:value-of select="@name"/>';
			output += '			</option>';
			output += '		</xsl:for-each>';
			output += '		</select><br/>';
			output += '	<h2>Search by Name (first name | second name)</h2>';			
			output += '	<input id="firstname" value="" onkeyup="keychecker();" onBlur="namebox(&#39;efirst&#39;);" onfocus="namebox(&#39;first&#39;);" />';
			output += ' <input id="lastname"  value="" onkeyup="keychecker();" onBlur="namebox(&#39;elast&#39;);" onfocus="namebox(&#39;last&#39;);" />';
			output += '	<h2>Search by Skills</h2>';			
			output += '	<input id="skill" value="" onkeyup="keychecker();" onBlur="namebox(&#39;eskill&#39;)" onfocus="namebox(&#39;skill&#39;)"/><hr/>';		
			output += '	<input type="button" value="Search" onClick="findcolleagues()"/><input type="button" value="Reset" onClick="reset()"/>';				
			output += '	</xsl:template>';
			
			//output += '	<!-- Result Display template -->';		
			output += '	<xsl:template name="datadisplay">';		
			output += '		<tr class="data">';
			output += '			<xsl:choose>';
			output += '				<xsl:when test="@pic=&#39;&#39;">';
			output += '					<td rowspan="3"><img class="image" src="people/{@fname}_{@lname}.png"/></td>';
			output += '				</xsl:when>';
			output += '				<xsl:otherwise>';
			output += '					<td rowspan="3"><img class="image" src="people/silhouette.png"/></td>';
			output += '				</xsl:otherwise>';
			output += '			</xsl:choose>';		
			output += '			<td class="functions" rowspan="3">';
			output += '				<a href="javascript:org_chart(\'{@empid}\')">Org Chart</a><br/>';
			//output += '				<a target="_blank" href="#{@int}">Team Page</a><br/>';
			output += '				<xsl:if test="string-length(@rep)!=0"><a title="View who {@fname} {@lname} reports to" href="javascript:reporter(\'{@rep}\')">Reports To</a><br/></xsl:if>';		
			output += '			<xsl:choose>';		
			output += '				<xsl:when test="@man=&#39;&#39;">';		
			output += '					<a title="View who reports to {@fname} {@lname}" href="javascript:directrep(\'{@empid}\')">Direct Report</a><br/>';
			output += '				</xsl:when>';		
			output += '			</xsl:choose>';	
			output += '				<a title="Email {@fname} {@lname}" href="mailto:{@email}">Email</a><br/>';				
			output += '			</td>';
			output += '			<td class="detail"><xsl:value-of select="@sal"/></td>';
			output += '			<td class="detail"><xsl:value-of select="@fname"/></td>';
			output += '			<td class="detail"><xsl:value-of select="@lname"/></td>';
			output += '			<td class="detail"><xsl:value-of select="@jobtitle"/></td>';
			output += '			<td class="detail"><xsl:value-of select="@phone"/></td>';
			output += '			<td class="detail">(<xsl:value-of select="@lc"/>)</td>';		
			output += '			<td class="detail"><xsl:value-of select="@internal"/></td>';
			output += '			<td class="detail"><xsl:value-of select="@mobile"/></td>';
			output += '		</tr>';
			output += '		<tr class="data">';		
			output += '			<td class="address" colspan="11"><address>';
			output += '				<a title="View Team" href="javascript:viewteam(\'{../@did}\',\'{../@tid}\')"><xsl:value-of select="../@name"/></a>,';
			output += '				<a title="View Department" href="javascript:viewdept(\'{../@did}\')"><xsl:value-of select="../../@name"/></a>,<br/> Organisation Name';
			output += '<xsl:if test="string-length(@fl)!=0">, <xsl:value-of select="@fl"/></xsl:if>';
			output += '<xsl:if test="string-length(@ad1)!=0">, <xsl:value-of select="@ad1"/></xsl:if>';
			output += '<xsl:if test="string-length(@ad2)!=0">, <xsl:value-of select="@ad2"/></xsl:if>';
			output += '<xsl:if test="string-length(@ad3)!=0">, <xsl:value-of select="@ad3"/></xsl:if>';
			output += '<xsl:if test="string-length(@city)!=0">, <xsl:value-of select="@city"/></xsl:if>';
			output += '<xsl:if test="string-length(@pc)!=0">, <xsl:value-of select="@pc"/></xsl:if>';
			output += '			</address></td>';
			output += '		</tr>';
			output += '		<tr>';		
			output += '			<td class="cred" height="40" colspan="10">';
			output += '				<xsl:if test="string-length(@pa)!=0"><strong>Professional Accreditation: </strong> <xsl:value-of select="@pa"/></xsl:if>';
			output += '				<xsl:if test="string-length(@key)!=0"><br/><strong>Key Skills: </strong> <xsl:value-of select="@key"/></xsl:if>';	
			output += '			</td>';
			output += '		</tr>';
			output += '	</xsl:template>';
			
			//output += '	<!-- Main template-->';
			output += '	<xsl:template match="/">';
			output += '		<xsl:call-template name="selector"/>';		
			output += '		<table>';
			output += '		<colgroup><col style="width: 7%" /><col style="width: 11%" /><col style="width: 4%" /><col style="width: 10%" /><col style="width: 10%" /><col style="width: 22%" /><col style="width: 12%" /><col style="width: 5%" /><col style="width: 7%" /><col style="width: 13%" /></colgroup>';		
			output += '		<thead>';
			output += '			<tr>';
			output += '				<th>Photo</th>';
			output += '				<th>Other</th>';
			output += '				<th>Title</th>';
			output += '				<th>First</th>';
			output += '				<th>Last</th>';
			output += '				<th>Job Title</th>';
			output += '				<th>Phone</th>';
			output += '				<th>Code</th>';		
			output += '				<th>Internal</th>';
			output += '				<th>Mobile</th>';
			output += '			</tr>';
			output += '		</thead>';
			output += '		<tbody>';

			//output += '	<!-- Logic -->';
			output += '			<xsl:choose>';
			output += '				<xsl:when test="string-length($reportsto)!=0">';
			output += '					<xsl:for-each select="colleagues/dept/team/col[@empid=$reportsto]">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';
			
			output += '				<xsl:when test="string-length($empid)!=0">';
			output += '					<xsl:for-each select="colleagues/dept/team/col[@empid=$empid]">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';			
			
			output += '				<xsl:when test="string-length($directrep)!=0">';
			output += '					<xsl:for-each select="colleagues/dept/team/col[@rep=$directrep]">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';			
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';		
			
			output += '				<xsl:when test="string-length($skill)!=0">';
			output += '					<xsl:for-each select="colleagues/dept/team/col">';
			output += '					<xsl:sort select="@lname" order="ascending"/>';		
			output += '					<xsl:sort select="@fname" order="ascending"/>';			
			output += '					<xsl:if test="contains(translate(@pa,$uc,$lc),translate($skill,$uc,$lc)) or contains(translate(@key,$uc,$lc),translate($skill,$uc,$lc))">';
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:if>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';		
		
			output += '				<xsl:when test="$fname!=&#39;&#39; or $lname!=&#39;&#39;">';
			output += '					<xsl:for-each select="colleagues/dept/team/col[contains(translate(@fname,$uc,$lc), translate($fname,$uc,$lc)) and contains(translate(@lname,$uc,$lc), translate($lname,$uc,$lc))]">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';			
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';	
		
			output += '				<xsl:when test="$team!=&#39;Select Department&#39; and $team=0">';
			output += '					<xsl:for-each select="colleagues/dept[@did=$department]/team[*]/col">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';	
			output += '						<xsl:sort select="@fname" order="ascending"/>';		
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';	

			output += '				<xsl:when test="string-length($department)!=0 and string-length($team)!=0">';
			output += '					<xsl:for-each select="colleagues/dept[@did=$department]/team[@tid=$team]/col">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';			
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:when>';
				
			output += '				<xsl:otherwise>';
			output += '					<xsl:for-each select="colleagues/dept[@did=$department]/team[*]/col">';
			output += '						<xsl:sort select="@lname" order="ascending"/>';		
			output += '						<xsl:sort select="@fname" order="ascending"/>';				
			output += ' 					<xsl:call-template name="datadisplay"/>';
			output += '					</xsl:for-each>';
			output += '				</xsl:otherwise>';
			output += '			</xsl:choose>';
				
			output += '		</tbody>';
			output += '		</table>';
			output += '	</xsl:template>';
			output += '</xsl:stylesheet>';
		}
	this.xslProc.importStylesheet(output);
};
function reset() {
	peoplefinder.sort("","","","","","","","");
}
/* Here be dragons! */
function selectfilter(selectobj,previous) {
  this.selectobj = selectobj;
  this.init = function() {
    this.optionscopy = new Array();
    if (this.selectobj && this.selectobj.options){
      for (var i=1; i < this.selectobj.options.length; i++) {
        this.optionscopy[i] = new Option();
        this.optionscopy[i].text = selectobj.options[i].text;
        if (selectobj.options[i].value) {
          this.optionscopy[i].value = selectobj.options[i].value;
        }
      }
    }
  };
  this.reset = function(text) {
    this.set("","",text);
  };
  this.set = function(pattern,changer,text,reset) {
    var loop=1, index=1;
	this.selectobj.options.length = 0;
	this.selectobj.options[0] = new Option(text,"0",false);
    for (loop=1; loop < this.optionscopy.length; loop++) {
      var option = this.optionscopy[loop];
      if (pattern===option.value.split("|")[0]) {
		this.selectobj.options[index++] = new Option(option.text,option.value,false);
      }else{}
    }
  };
  this.init();
}

function reporter(id) {
	peoplefinder.sort("","","","",id,"","","");
}

function org_chart(id) {
	peoplefinder.sort("","","","","","","",id,"org_chart");
}

function directrep(id) {
	peoplefinder.sort("","","","","",id,"","");
}
function viewteam(d,t) {
	peoplefinder.sort(d,t,"","","","","","");
	getid("department").value = d;
	teamfilter.set(getid("department").options[getid("department").selectedIndex].value.split("|")[0],"team","Select Team *",0);
	getid("team").value = d+"|"+t;
}

function viewdept(d) {
	peoplefinder.sort(d,"","","","","","","");
	getid("department").value = d;
	teamfilter.set(getid("department").options[getid("department").selectedIndex].value.split("|")[0],"team","Select Team *",0);	
}

function departments() {
	departmentfilter.set(getid("department").options[getid("department").selectedIndex].value,"department","Select Department",0);
}
function teams() {
	teamfilter.reset("Select Team *");
	teamfilter.set(getid("department").options[getid("department").selectedIndex].value.split("|")[0],"team","Select Team *",0);
	document.getElementById("team").disabled=false;
}
function keychecker(e) {
    var pressedKey;
    if (document.all)    { e = window.event; }
    if (document.layers) { pressedKey = e.which; }
    if (document.all)    { pressedKey = e.keyCode; }
    pressedCharacter = String.fromCharCode(pressedKey);
	if (pressedKey==13) {
		e.returnValue = false;
		findcolleagues();
	}
}
function findcolleagues() {
	var fname = getid("firstname").value;
	var lname = getid("lastname").value;
	var skill = getid("skill").value;
	var d = getid("department").value;
	var t = getid("team").value.split("|")[1];
	peoplefinder.sort(d,t,fname,lname,"","",skill);
}
/* DROSS */
function namebox(type) {
	if (type==="last"){
		getid("lastname").style.backgroundColor="#ccc";
	}
	else{
		getid("lastname").style.backgroundColor="#fff";
	}
	
	if (type==="first"){
		getid("firstname").style.backgroundColor="#ccc";
	}
	else{
		getid("firstname").style.backgroundColor="#fff";
	}
	if (type==="skill"){
		getid("skill").style.backgroundColor="#ccc";
	}
	else{
		getid("skill").style.backgroundColor="#fff";
	}	
}

function cboReset() {}

/* Init */
function start() {
	peoplefinder.init();
}
function getid(id) {return document.getElementById(id);}
window.onload = start;
