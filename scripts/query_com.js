var CourtBox = React.createClass({
	getInitialState: function(){
		return {
			mode:'list',
			data:[],
			filterCourtNm: '',//篩選法庭
			filterDpt:'',//篩選股別
			courtNms:[],//法庭清單
			dpts:[],//股別清單
			courtKds:[],//庭類清單
			crtids:[],//法院清單
			crtid:'TYD',//法院
			sysArray:[],//庭別清單
			sys:'H',//庭別
			isloading: false,//是否讀取中
			uiDisabled: false,//UI是否啟用
			radioGroup:null
		};
	},
	//設定篩選參數
	handleFilterInput: function(filterCourtNm, filterDpt){
		this.setState({
			filterCourtNm: filterCourtNm,
			filterDpt: filterDpt
		});
	},
	//設定查詢參數
	handleQueryInput: function(crtid, sys){
		this.setState({
			crtid: crtid,
			sys: sys
		});
	},
	handleRadioInput:function(e){
		var row = this.state.data[e.target.value];//抓出被選擇的資料
		//console.log(this.refs.title.textContent);
		var crtName = this.state.crtids.getNameByIndex(this.state.crtid, "crtid", "crtname");//找法院
		var sysName = this.state.sysArray.getNameByIndex(this.state.sys, "sys", "sysname");//找庭別
		var caseName = row.crmyy + "年 " + row.crmid + "字 第" +Number(row.crmno) + "號";
		this.refs.title.textContent=caseName;//設定標題
		console.log(this.refs.title.textContent);
		//console.log(ROCtoAD(row.courtdate));
		this.refs.start.textContent=ROCtoAD(row.courtdate) + " " + row.courtime.insert(2,":");//設定行事曆開始時間 24H
		this.refs.end.textContent=ROCtoAD(row.courtdate) + "";//不給結束的時間好像會自動加一個小時作為結束
		//設定內容
		this.refs.description.innerHTML = caseName + "<br>" + 
										"法院:" + this.state.crtid + " " + crtName + "<br>" + 
										"案件類別:" + sysName + "<br>" + 
										"庭類:" + row.courtkd + "<br>" + 
										"股別:" + row.dpt;
		this.refs.location.textContent=row.courtnm;//設定開庭地點
		this.setState({
			radioGroup:e.target
		});
	},
	setMode:function(mode){
		this.setState({
			mode: mode
		});
		console.log(mode);
	},
	//查詢法院案件
	queryCourts: function(crtid, sys, date1, date2){
		//console.log(this.state.crtid+ this.state.sys);
		//console.log(crtid+sys);
		this.setState({uiDisabled:true});//停用按鈕
		this.setState({isloading: true});
		this.loadCourtsFromServer(crtid, sys,date1,date2);
		this.setState({
			crtid: crtid,
			sys: sys,
			//filterCourtNm: ''
		});
	},
	//讀取資料
	loadCourtsFromServer: function(crtid, sys,date1,date2){
		var url = getCourtUrl(crtid,sys,date1,date2);
		console.debug(url);
		//抓取法庭資料
		$.ajax({
			url: url,
    		crossDomain: true,
    		//dataType: 'jsonp xml',
    		dataType: 'json',
			cache: false,
			success: function(data){
				var array = data.query.results.DATA.rowid;
				//處理回傳的資料
				if(array){
					//有可能只回傳一筆資料，需轉換成array避免後續無法使用array方法
					if(!(array instanceof Array)){
						console.log("Data not array.");
						var tmp=[];
						tmp.push(array);
						array = tmp;
						//console.log(array instanceof Array);
					}
					this.setState({data:array});
					//console.log(data.query.results.DATA.rowid);
					//console.log(data.query.results.DATA);
					
					//console.time("concatenation");
					/*
					//此方法效能不佳
					var nm = array.map(function(obj) { return obj.courtnm; });
					nm = nm.filter(function(v,i) { return nm.indexOf(v) == i; });
					*/
					//console.time("concatenation");
					// var nm = getUniqueList(array,"courtnm");//取出不重複法庭
					// nm.sort();
					//取出股別清單
					var dpt = getUniqueList(array,"dpt");//取出不重複股別
					dpt.sort();
					var courtkd = getUniqueList(array,"courtkd");//取出不重複庭類
					courtkd.sort();
					//console.timeEnd("concatenation");
					//取出法庭清單，並根據id排序
					var nm = getNMList(array);
					nm.sort(function(a, b) {
					    var aid = Number(a.courtid);
					    var bid = Number(b.courtid);
					    if (aid > bid) {
					        return 1;
					    }
					    if (aid < bid) {
					        return -1;
					    }
					    // a must be equal to b
					    return 0;
					});
					//console.log(nm);

					/*放在同一個FUNCTION沒比較快*/
					// console.time("concatenation");
					// var properties = ["courtnm", "dpt"];
					// var uniqueLists = getMultiUniqueList(array, properties);
					// var nm = uniqueLists[0];
					// var dpt = uniqueLists[1];
					// nm.sort();
					// dpt.sort();
					// console.timeEnd("concatenation");

					this.setState({courtNms:nm, dpts:dpt, courtKds:courtkd});
					//console.timeEnd("concatenation");
					//console.log(nm);
					addScrollTop();
					//取消月曆勾選
					if(this.state.radioGroup){
						this.state.radioGroup.checked = false;
					}
					//隱藏讀取符號
					this.setState({isloading: false});
				}else{
					console.log("Courts is empty.");
					this.setState({data:[], courtNms:[], dpts:[]});//清空資料
				}
				
			}.bind(this),
			error: function(xhr, status, err){
				console.error(url, status, err.toString());
			}.bind(this),
			complete: function(){
				this.setState({uiDisabled:false});//停用按鈕
			}.bind(this),

		});
	},
	//讀取法院資料
	loadQueryData: function(){
		var path = "./data/court-data.json";
		$.ajax({
		    url: path,
		    dataType: 'json',
		    success: function(data) {
		    	//console.log(data);
		    	if(data){
		        	this.setState({crtids: data});
				}
		    }.bind(this),
			error: function(xhr, status, err){
				//console.log(xhr.responseText);
				console.error(path, status, err.toString());
			}.bind(this),
		});
		path = "./data/sys-data.json";
		$.ajax({
		    url: path,
		    dataType: 'json',
		    success: function(data) {
		    	//console.log(data);
		    	if(data){
		        	this.setState({sysArray: data});
				}
		    }.bind(this),
			error: function(xhr, status, err){
				//console.log(xhr.responseText);
				console.error(path, status, err.toString());
			}.bind(this),
		});
	},

	//componentDidMount is a method called automatically by React after a component is rendered for the first time. 
	componentDidMount: function(){
		//console.log('test');
		//this.loadCourtsFromServer("TYD","H");
		//setInterval(this.loadCommentsFromServer, this.props.pollInterval);
		addeventatc.refresh();//reload addevent
		this.loadQueryData();
	},
	render: function(){
		var result = <CourtList data={this.state.data} filterCourtNm={this.state.filterCourtNm} 
					filterDpt={this.state.filterDpt} onSelectRadio={this.handleRadioInput}/>;
		if(this.state.mode==='Calendar'){
			result = 'Calendar';
		}else if(this.state.mode==='Contact'){
			result = 'Contact';
		}
		return (
			<div className="queryBox">
				<QueryNav onSelectMode={this.setMode}/>
				<QueryForm crtids={this.state.crtids} crtid={this.state.crtid} 
					sysArray={this.state.sysArray} sys={this.state.sys} 
					onQuery={this.handleQueryInput} submitQuery={this.queryCourts} 
					uiDisabled={this.state.uiDisabled} />
				<FilterForm courtNms={this.state.courtNms} dpts={this.state.dpts}  
					filterCourtNm={this.state.filterCourtNm} filterDpt={this.state.filterDpt} 
					onFilter={this.handleFilterInput} uiDisabled={this.state.uiDisabled} />
				{/*<LoadingComp isloading={this.state.isloading} />*/}
				{result}
				<span id="addeventatc-block" className="btn btn-default">
					<div title="Add to Calendar" className="addeventatc">
					    <img src="image/calendar-clock32.png" alt="" />
					    <span ref="start" className="start"></span>
					    <span ref="end" className="end"></span>
					    <span className="timezone">Asia/Taipei</span>
					    <span ref="title" className="title"></span>
					    <span ref="description" className="description"></span>
					    <span ref="location" className="location"></span>
					    <span className="all_day_event">false</span>
					    <span className="date_format">YYYY-MM-DD</span>
					</div>
				</span>
			</div>
		);
	}
});

/*
選單參考
http://stackoverflow.com/questions/22461129/switch-class-on-tabs-with-react-js
*/
var QueryNav = React.createClass({
    getInitialState: function() {
        return {
            activeMenuItemUid: 'List'
        };
    },
	getDefaultProps: function() {
        return {
            menuItems: [{
                uid: 'List'
            }, {
                uid: 'Calendar'
            }, {
                uid: 'Contact'
            }]
        };
    },
    setActiveMenuItem: function(uid) {
        this.setState({
            activeMenuItemUid: uid
        });
        this.props.onSelectMode(uid);//傳到根結點
    },

	render: function() {
		var menuItems = this.props.menuItems.map(function(menuItem) {
			return(<MenuItem  key={menuItem.uid} active={(this.state.activeMenuItemUid === menuItem.uid)} 
				onSelect={this.setActiveMenuItem} uid={menuItem.uid} />);        
		},this);//如果要用到this記得要bind this
        return (
		    <nav className="navbar navbar-inverse navbar-fixed-top">
		        <div className="container">
		            <div className="navbar-header">
		                <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
		                    <span className="sr-only">Toggle navigation</span>
		                    <span className="icon-bar"></span>
		                    <span className="icon-bar"></span>
		                    <span className="icon-bar"></span>
		                </button>
		                <a className="navbar-brand" href="#">台灣法院庭期查詢</a>
		            </div>
		            <div id="navbar" className="collapse navbar-collapse">
		                <ul className="nav navbar-nav">
		                    {menuItems}
		                </ul>
		            </div>
		        </div>
		    </nav>
		);
	}
});

var MenuItem = React.createClass({
  handleClick: function(event) {
    event.preventDefault();
    this.props.onSelect(this.props.uid);
  },
  render: function() {
    var className = this.props.active ? 'active' : null;//是否被選取
    return (
    	<li className={className}><a href={"#" + this.props.uid} onClick={this.handleClick}>{this.props.uid}</a></li>
    );
  }
});

var QueryForm = React.createClass({
	handleQueryChange: function(e){
		this.props.onQuery(
			this.refs.crtidInput.value,
			this.refs.sysInput.value
		);
	},
	handleSubmit: function(e){
		//console.log(this.refs.crtidInput.value+this.refs.sysInput.value);
		var date1 = ADtoROC(this.refs.date1.value);
		var date2 = ADtoROC(this.refs.date2.value);
		console.log(date1+'  '+date2);
		this.props.submitQuery(this.refs.crtidInput.value, this.refs.sysInput.value, date1, date2);
		e.preventDefault();//要先取消避免刷新頁面
		this.refs.submitBtn.blur();
		$(this).blur();
	},
	componentDidMount: function(){
	  	$(function() {
	  		var today = new Date();
	  		var days = 7;
	  		var parameters = {dateFormat:"yy-mm-dd",showButtonPanel: true};
	    	$( "#datepicker1" ).datepicker(parameters).datepicker("setDate", today);
	    	today.setDate(today.getDate() + days);//預設加上N天
	    	$( "#datepicker2" ).datepicker(parameters).datepicker("setDate", today);
	    	//避免移動裝置鍵盤跳出
	    	$('#datepicker1,#datepicker2').on('focus', function(e) {
    			e.preventDefault();
    			$(this).blur();
			});

	  	});
	},		
	render: function() {
		var uiClass = "";
		if(!this.props.uiDisabled){
			uiClass = "hidden";
		}
		var crtsNodes = this.props.crtids.map(function(crt){
			return(<option key={crt.crtid+crt.crtname} value={crt.crtid}>{crt.crtname}</option>);
		});
		var sysArrayNodes = this.props.sysArray.map(function(sys){
			return(<option key={sys.sys} value={sys.sys}>{sys.sysname}</option>);
		});
		return (
			<div className="content">
				<h4>查詢</h4>
				<form onSubmit={this.handleSubmit}>
					<div className="form-group form-inline">
						<div className="form-group">
							<select ref="crtidInput" onChange={this.handleQueryChange} className="form-control" value={this.props.crtid}>
								{crtsNodes}		
							</select>
						</div>
						<div className="form-group">
							<select ref="sysInput" onChange={this.handleQueryChange} className="form-control" value={this.props.sys}>
								{sysArrayNodes}			
							</select>
						</div>
						<div className="form-group">
							<button ref="submitBtn" type="submit" className="btn btn-default" disabled={this.props.uiDisabled}>查詢</button>
							<img src="image/loading.gif" className={uiClass}/>
						</div>
					</div>
					<div className="form-group form-inline">
                    	<input type="text" ref="date1" id="datepicker1" placeholder="開始日期" className="form-control"/>
                    	<label>至</label>
                    	<input type="text" ref="date2" id="datepicker2" placeholder="結束日期" className="form-control"/>
                	</div>
				</form>
			</div>
		);
	}
});


//過濾條件
var FilterForm = React.createClass({
	handleFilterChange: function(e) {
    	this.props.onFilter(
    		this.refs.courtNmInput.value,
    		this.refs.dptInput.value
    	);
  	},
	render: function() {
		var courtNmNodes = this.props.courtNms.map(function(courtNm){
			return(<option key={courtNm.courtid} value={courtNm.courtnm}>{courtNm.courtnm}</option>);
		});
		var dptNodes = this.props.dpts.map(function(dpt){
			return(<option key={dpt} value={dpt}>{dpt}</option>);
		});
		//UI Disable
		var opts={};
		if (this.props.uiDisabled) {
            opts['disabled'] = 'disabled';
        }
		return (
			<div className="content">
				<h4>篩選</h4>
				<form className="form-inline">
					<div className="form-group">
					<select ref="courtNmInput" onChange={this.handleFilterChange} className="form-control" value={this.props.filterCourtNm} {...opts}>
						<option value="">所有法庭</option>
						{courtNmNodes}
						{/*
						<option value="第一法庭">第一法庭</option>
						<option value="第二法庭">第二法庭</option>
						<option value="第三法庭">第三法庭</option>
						<option value="第四法庭">第四法庭</option>
						<option value="第五法庭">第五法庭</option>
						<option value="第六法庭">第六法庭</option>
						<option value="第七法庭">第七法庭</option>
						<option value="第八法庭">第八法庭</option>
						<option value="第九法庭">第九法庭</option>
						<option value="第十法庭">第十法庭</option>
						<option value="第十一法庭">第十一法庭</option>
						<option value="第十二法庭">第十二法庭</option>
						<option value="第十三法庭">第十三法庭</option>
						<option value="第十四法庭">第十四法庭</option>
						<option value="第十五法庭">第十五法庭</option>
						<option value="第十六法庭">第十六法庭</option>
						<option value="第十七法庭">第十七法庭</option>
						<option value="第十八法庭">第十八法庭</option>	
						*/}			
					</select>
					</div>
					<div className="form-group">
					<select ref="dptInput" onChange={this.handleFilterChange} className="form-control" value={this.props.filterDpt} {...opts}>
						<option value="">所有股別</option>
						{dptNodes}	
					</select>
					</div>
				</form>
			</div>
		);
	}
});

//案件清單
var CourtList = React.createClass({
	condition: function(court){
		var filterCourtNm = this.props.filterCourtNm.trim();
		var filterDpt = this.props.filterDpt.trim();
		return (!filterCourtNm || court.courtnm === filterCourtNm) && (!filterDpt || court.dpt === filterDpt);
	},
	mapFunction: function(court){
			return(
				<Court key={court.num} num={court.num} sys={court.sys} crmyy={court.crmyy}
					crmid={court.crmid} crmno={court.crmno} courtdate={court.courtdate}
					courtime={court.courtime} courtnm={court.courtnm} dpt={court.dpt}
					courtkd={court.courtkd} courtid={court.courtid} crtid={court.crtid} onSelectRadio={this.props.onSelectRadio}>
				</Court>
			); 
		},
	render: function() {
		//console.log('out:'+this.props.filterCourtNm);
		//var filterCourtNm = this.props.filterCourtNm.trim();
		//console.log(this.props.data);
		var courtNodes = this.props.data.filter(this.condition).map(this.mapFunction);
		return (
			<div className="content">
				<div>共{courtNodes.length}件</div>
				<table className="table table-bordered table-striped">
					<thead>
					<tr>
						{/*
						<td>序號</td>
						<td>類別</td>
						*/}	
						<td>年度</td>
						<td>字別</td>
						<td>案號</td>
						<td>開庭日期</td>	
						<td>開庭時間</td>
						<td>法庭</td>
						<td>股別</td>
						<td>庭類</td>
						<td><img src="image/calendar-clock24.png" alt="" /></td>
						{/*
						<td>法庭</td>
						<td>法院</td>
						*/}		
					</tr>
					</thead>
					<tbody>
						{courtNodes}
					</tbody>
				</table>
			</div>
		);
	}
});

//案件
/*
courtdate:"1050602"
courtid:"0097"
courtime:"0900"
courtkd:"調解"
courtnm:"刑事調解庭(一)"  = courtid
crmid:"訴"
crmno:"000306"
crmyy:"105"
crtid:"TYD"
dpt:"騰"
num:"0"
sys:"H"
*/
var Court = React.createClass({
	render: function() {
		return (
			<tr>
				{/*
				<td>{this.props.num}</td>
				<td>{this.props.sys}</td>
				*/}	
				<td>{this.props.crmyy}</td>
				<td>{this.props.crmid}</td>
				<td>{Number(this.props.crmno)}</td>
				<td>{this.props.courtdate}</td>	
				<td>{this.props.courtime.insert(2,":")}</td>
				<td>{this.props.courtnm}</td>
				<td>{this.props.dpt}</td>
				<td>{this.props.courtkd}</td>
				<td>
					<input type="radio" name="calRadios" value={this.props.num} onChange={this.props.onSelectRadio}/>
				</td>
				{/*
				<td>{this.props.courtid}</td>
				<td>{this.props.crtid}</td>	
				*/}			
			</tr>
		);
	}	
});

//目前還沒用到
var LoadingComp = React.createClass({
	render: function() {
		if(this.props.isloading){
			return (
				<img src="image/loading.gif" />
			);
		}else{
			return(<div className="hidden"></div>);
		}
	}
});

//取得法院查詢的YQL URL
function getCourtUrl(crtid, sys, dateBegin, dateEnd){
	if(!dateBegin || !dateEnd){
		dateBegin = '';
		dateEnd = '';
	}
	if(!crtid || !sys){//empty
		return;
	}
	return "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_COURTDATA.jsp%3Fcrtid%3D"+crtid+"%26sys%3D"+sys+"%26date1%3D"+dateBegin+"%26date2%3D"+dateEnd+"'&format=json&callback=";
};

//處理TOP按鈕，等資料載入完再呼叫
function addScrollTop() {
    // Only enable if the document has a long scroll bar
    // Note the window height + offset
    if (($(window).height() + 100) < $(document).height()) {
        $('#top-link-block').removeClass('hidden').affix({
            // how far to scroll down before link "slides" into view
            offset: {
                top: 100
            }
        });
        /*直接讓他一直顯示，不隱藏*/
        // $('#addeventatc-block').removeClass('hidden').affix({
        //     // how far to scroll down before link "slides" into view
        //     offset: {
        //         top: 100
        //     }
        // });
    }
};

//取出不重複清單
function getUniqueList(array, property){
	var unique = {};
	var distinct = [];
	for( var i in array ){
	 if( typeof(unique[array[i][property]]) == "undefined"){
	  distinct.push(array[i][property]);
	 }
	 unique[array[i][property]] = 0;
	}
	return distinct;
};
//取法庭ID跟名稱
function getNMList(array){
	var unique = {};
	var distinct = [];
	for( var i in array ){
	 if( typeof(unique[array[i]["courtnm"]]) == "undefined"){
	  distinct.push({"courtid":array[i]["courtid"],"courtnm":array[i]["courtnm"]});
	 }
	 unique[array[i]["courtnm"]] = 0;
	}
	return distinct;
};
//取出不重複清單(多欄位)
function getMultiUniqueList(array, properties) {
    var unique = [];
    var distinct = [];
     for (var i in properties) {
     	//console.log(i);
     	unique[i]={};
     	distinct[i]=[];
     }
    for (var i in array) {
    	//console.log(i);
        for (var j in properties) {
        	var propName = properties[j];
            if (typeof(unique[j][array[i][propName]]) == "undefined") {
                distinct[j].push(array[i][propName]);
            }
            unique[j][array[i][propName]] = 0;
        }
    }
    return distinct;
};


//format:YYYY-MM-DD
function ADtoROC(ADdate){
	var ADdateStr = ADdate.toString().replace(/-/g,'');//刪除-
	var ROCdate = parseInt(ADdateStr.substring(0,4))-1911 + ADdateStr.substring(4);//西元轉民國
	return ROCdate;//format:yyyMMDD
}
//format:yyyMMDD
function ROCtoAD(ROCdate){
	var ADdateNum = Number(ROCdate)+19110000;
	var ADdateStr = ADdateNum.toString();//變成YYYYMMDD
	var ADdate = parseInt(ADdateNum/10000) + "-" + (parseInt(ADdateNum/100)%100) + "-"+ADdateNum%100;
	return ADdate;//format:YYYY-MM-DD
}

Array.prototype.getNameByIndex = function (value, findCol, returnCol){
	var tmp = $.grep(this, function(e){ return e[findCol] == value;});
	return tmp[0][returnCol];
};

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

/*
cross domain處理YQL
http://clayliao.blogspot.tw/2011/03/yqlintroduxtion.html
*/
//http://210.69.124.207/abbs/wkw/WHD_PDA_GET_COURTDATA.jsp?crtid=TYD&sys=H
ReactDOM.render(
	<CourtBox pollInterval={200000}/>,
	document.getElementById('content')
);