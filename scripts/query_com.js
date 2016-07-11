var CourtBox = React.createClass({
	getInitialState: function(){
		return {
			mode:'List',
			data:[],
			filterCourtNm: '',//篩選法庭
			filterDpt:'',//篩選股別
			filterCourtKd:[],//篩選庭類
			filterArray:[],//文字篩選器
			filterAmTime:[],//早上跟下午的選項
			filterAmTimeflag:0,//早上跟下午的選項
			courtNms:[],//法庭清單
			dpts:[],//股別清單
			courtKds:[],//庭類清單
			crtids:[],//法院清單
			crtid:'TYD',//法院
			sysArray:[],//庭別清單
			sys:'H',//庭別
			isloading: false,//是否讀取中
			isShowSessTime: false,//是否顯示開畢庭時間
			uiDisabled: false,//UI是否啟用
			radioGroup:null
		};
	},
	//設定篩選參數
	handleFilterInput: function(filterCourtNm, filterDpt){
		//寫入Cookies
		if(filterCourtNm){
			//var courtid = this.state.courtNms[this.state.courtNms.map(function(tmp) {return tmp.courtnm;}).indexOf(filterCourtNm)].courtid;//法庭轉ID
			setCookie("filterCourtNm", filterCourtNm, 365);
		}else{
			deleteCookie("filterCourtNm");
		}
		if(filterDpt){
			setCookie("filterDpt", filterDpt, 365);
		}else{
			deleteCookie("filterDpt");
		}
		this.setState({
			filterCourtNm: filterCourtNm,
			filterDpt: filterDpt
		});
	},
	//顯示開庭時間
	onShowSessTimeClick: function(checkbox){
		this.setState({
			isShowSessTime: checkbox.checked
		});
	},
	//庭別篩選
	onCourtKDClick: function(checkbox){
		var tmp = this.state.filterCourtKd;
		//console.log(tmp);
		tmp[checkbox.value] = !tmp[checkbox.value];
		this.setState({
			filterCourtKd: tmp
		});
	},
	//上下午篩選
	onAmTimeClick: function(checkbox){
		var tmp = this.state.filterAmTime;
		tmp[checkbox.value] = !tmp[checkbox.value];
		//console.log(tmp);
		if(!tmp[amTimes[0]] && !tmp[amTimes[1]]){
			tmp[amTimes[0]] = true;
			tmp[amTimes[1]] = true;
			tmp[checkbox.value] = !tmp[checkbox.value];
		}
		var flag=0;
		if(tmp[amTimes[0]] && tmp[amTimes[1]]){
		}else if(tmp[amTimes[0]]){
			flag=1;
		}else if(tmp[amTimes[1]]){
			flag=-1;
		}		
		this.setState({
			filterAmTime: tmp,
			filterAmTimeflag: flag
		});
	},	
	//設定查詢參數
	handleQueryInput: function(crtid, sys){
		//寫入Cookies
		setCookie("crtid", crtid, 365);
		setCookie("sys", sys, 365);
		this.setState({
			crtid: crtid,
			sys: sys
		});
	},
	//處理行事曆的內容
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
		this.refs.location.textContent=crtName + " " + sysName + " " + row.courtnm;//設定開庭地點
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
	sortData: function(){
		//console.log("sort");
		var data = this.state.data;
		data.sort(function(a,b){
			var aNum = Number(a.courtdate+(a.courtime<AMCut ? "0" : "1")+a.courtid+""+a.courtime);
			var bNum = Number(b.courtdate+(b.courtime<AMCut ? "0" : "1")+b.courtid+""+b.courtime);
			//console.log(aNum+" "+bNum);
			if ( aNum >  bNum ) {
				return 1;
			}
			if ( aNum < bNum ) {
				return -1;
			}
			 // a must be equal to b
			return 0;			
		});
		this.setState({data:data});
	},
	filterText: function(filterArray){
		console.log(filterArray);
		this.setState({
			filterArray:filterArray
		});
	},
	//查詢法院案件
	queryCourts: function(crtid, sys, date1, date2){
		//console.log(this.state.crtid+ this.state.sys);
		//console.log(crtid+sys);
		this.setState({
			uiDisabled:true, 
			isloading: true,
			crtid: crtid,
			sys: sys
		});//停用按鈕，記錄法院及庭別
		this.loadCourtsFromServer(crtid, sys,date1,date2);
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
					//增加moment時間屬性
					array.map(function(court){
						court.realDate = moment(ROCtoAD(court.courtdate) + " " + court.courtime.insert(2,":"),"YYYY-MM-DD HH:mm");
					});
					//this.setState({data:array});
					//console.log(data.query.results.DATA.rowid);
					//console.log(data.query.results.DATA);
					

					//console.log(array);

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
					//照筆畫排序
					dpt.sort(function(a,b){
						return a.localeCompare(b);
					});
					//dpt.sort();
					var courtkd = getUniqueList(array,"courtkd");//取出不重複庭類
					courtkd.sort();
					var courtkdSelect=[];
					courtkd.map(function(kd) { courtkdSelect[kd]=true; });//初始化庭別選擇
					//console.log(courtkdSelect);
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
			
					//讀取Cookies
					var filterCourtNm = getCookie("filterCourtNm");
					var filterDpt = getCookie("filterDpt");
					console.log("room:"+filterCourtNm+" / "+filterDpt);
					if(filterCourtNm){
						//var filterCourtNm = nm[nm.map(function(tmp) {return tmp.courtid;}).indexOf(filterCourtid)].courtnm;//ID轉法庭名稱
						this.setState({
							filterCourtNm: filterCourtNm
						});
					}
					if(filterDpt){
						this.setState({
							filterDpt: filterDpt
						});
					}
					this.forceUpdate();

					//檢查是否股別存在於股別清單中
					if(dpt.indexOf(this.state.filterDpt)<0){
						this.setState({filterDpt:""});//清空篩選股別
					}
					//檢查是否法庭存在於法庭清單中
					var nm_tmp = nm.map(function(tmp) {return tmp.courtnm;});
					if(nm_tmp.indexOf(this.state.filterCourtNm)<0){
						this.setState({filterCourtNm:""});//清空篩選法庭
					}

					var amTimeSelect=[];
					amTimes.map(function(item) { amTimeSelect[item]=true; });//初始化上下午選擇

					this.setState({data:array, courtNms:nm, dpts:dpt, courtKds:courtkd, filterCourtKd:courtkdSelect, filterAmTime:amTimeSelect});
					//console.timeEnd("concatenation");
					//console.log(nm);
					addScrollTop();
					//取消月曆勾選
					if(this.state.radioGroup){
						this.state.radioGroup.checked = false;
					}
					//隱藏讀取符號
					//取消完讀取狀態，才開始擷取開庭狀態
					this.setState({isloading: false}, function() {
  						this.loadSessionState(crtid, sys);//讀取開庭狀態
  						setInterval(this.loadSessionState.bind(null,crtid,sys), this.props.pollInterval);//定時擷取資料
					});
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
	loadCourtFileData: function(){
		var path = "./data/court-data.json";//法院資訊
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
		path = "./data/sys-data.json";//庭別
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

	loadSessionState: function(crtid, sys){
		console.log(new Date() + " " + crtid +" " + sys + " get session.");
		var isJobsDone = Array.apply(null, {length: this.state.courtNms.length}).map(function() { return false; });
		//console.log(isJobsDone);
		var courtData = this.state.data;
		var tmpCourt = [];
		var countNew = 0;
		this.state.courtNms.map(function(courtNm, courtNmIndex){
			var url =  getSessionStateUrl(crtid,sys, courtNm.courtid);
			//var url = "https://graph.facebook.com/10150232496792613";
			console.log(url);
			$.ajax({
				url: url,
	    		crossDomain: true,
	    		dataType: 'json',
	    		//dataType: 'json',
				cache: false,
				success: function(data){
					//console.log(data);
					var count = data.query.count;
					//console.log(data);
					if(count>0){//當有回傳資料時
						if(typeof data.query.results.json.json == "undefined"){//當資料只回傳一筆時
							var array = data.query.results.json;
							//轉成陣列
							if(!(array instanceof Array)){
								console.log("Data not array.");
								var tmp=[];
								tmp.push(array);
								array = tmp;
								//console.log(array instanceof Array);
							}
						}else{//當資料回傳多筆時
							var array = data.query.results.json.json;
						}
						//組裝資料
						//var courtData = this.state.data;
						for(var i in array){//庭期進度
							var status = array[i];
							var statusIndex = status.crmyy+status.crmid+status.crmno+status.dudt+status.dutm+status.ducd;
							var isExist = false;
							for(var j in courtData){//庭期表
								var court = courtData[j];
								var courtIndex = court.crmyy+court.crmid+court.crmno+court.courtdate+court.courtime+court.courtid;
								if(statusIndex===courtIndex){
									court.rstarttm = status.rstarttm;
									court.rstoptm = status.rstoptm;
									court.status = status.status;
									isExist = true;
									break;
								}
							}
							if(!isExist && array.hasOwnProperty(i) ){//沒有存在再庭期表，且為該陣列原型
								//console.log(status);
								//console.log(courtData.length);
								//var pos = this.state.courtNms.map(function(e) { return e.courtid; }).indexOf(status.crmid);//找出法庭清單對應的名字
								//console.log(countNew);
								tmpCourt.push({
									courtdate:status.dudt,
									courtid:status.ducd,
									courtime:status.dutm,
									courtkd:status.dukd,
									courtnm:courtNm.courtnm,//法庭名稱會冠上刑事.....
									crmid:status.crmid,
									crmno:status.crmno,
									crmyy:status.crmyy,
									crtid:status.crtcd,
									dpt:status.dpt,
									num:(courtData.length + countNew),//用陣列最大值作為索引
									sys:status.crmkd,
									realDate:moment(ROCtoAD(status.dudt) + " " + status.dutm.insert(2,":"),"YYYY-MM-DD HH:mm"),
									rstarttm:status.rstarttm,
									rstoptm:status.rstoptm,
									status:status.status,
									newadd:true
								});
								countNew++;
							}
						}
						//this.setState({data:courtData});//更新資料
						//console.log(courtData);
						// console.log(array);
					}
				}.bind(this),
				error: function(xhr, status, err){
					console.error(url, status, err.toString());
				}.bind(this),
				complete: function(){
					isJobsDone[courtNmIndex] = true;
					//console.log(isJobsDone);
					if(isJobsDone.indexOf(false)<0){
						console.log("All status jobs done.");

						//照時間排序要插入的資料
						tmpCourt.sort(function(a, b) {
						    var atime = Number(a.courtdate+a.courtime);
						    var btime = Number(b.courtdate+b.courtime);
						    if (atime > btime) {
						        return 1;
						    }
						    if (atime < btime) {
						        return -1;
						    }
						    // a must be equal to b
						    return 0;
						});
						//反向搜尋，避免插入時位置改變
						var i = tmpCourt.length;//新增的資料
						var j = courtData.length;//原本的資料
						while( i-- ){
							var newdata = Number(tmpCourt[i].courtdate+tmpCourt[i].courtime);//插入資料的時間
							//console.log("j start:"+j);
							while( j-- ){
								var rawdata = Number(courtData[j].courtdate+courtData[j].courtime);//被插入的時間
								if(newdata > rawdata){//插入資料的時間大於被插入的時間，往下一筆的位置插入
									// console.log("insrt:"+j);
									// console.log(tmpCourt[i]);
									// console.log(newdata +" " +rawdata);
									courtData.insert(j+1, tmpCourt[i]);
									break;
								}
							}
							
						}
						this.setState({data:courtData});//統一一次更新資料，降低更新頻率
					}
				}.bind(this),
			});
		}.bind(this));
		
	},
	//資料條件篩選
	condition: function(court){
		return isfilterMatch(court, this.state.filterCourtNm.trim(), this.state.filterDpt.trim(), this.state.filterCourtKd, this.state.filterArray, this.state.filterAmTimeflag);
	},
	//componentDidMount is a method called automatically by React after a component is rendered for the first time. 
	componentDidMount: function(){
		//讀取Cookies
		var crtid = getCookie("crtid");
		var sys = getCookie("sys");
		console.log(crtid+" "+sys);
		if(crtid && sys){
			this.setState({
				crtid: crtid,
				sys: sys
			});
		}
		
		//console.log('test');
		//this.loadCourtsFromServer("TYD","H");
		//setInterval(this.loadCommentsFromServer, this.props.pollInterval);
		addeventatc.refresh();//reload addevent
		this.loadCourtFileData();
	},
	render: function(){
		var result = <CourtList data={this.state.data.filter(this.condition)} onSelectRadio={this.handleRadioInput} isShowSessTime={this.state.isShowSessTime}/>;
		if(this.state.mode==='Calendar'){
			result = <Calerdar selected={moment().startOf("day")} data={this.state.data.filter(this.condition)} isShowSessTime={this.state.isShowSessTime}/>;
		}else if(this.state.mode==='Contact'){
			result = <Contact />;
		}
		return (
			<div className="queryBox">
				<QueryNav onSelectMode={this.setMode}/>
				<QueryForm crtids={this.state.crtids} crtid={this.state.crtid} 
					sysArray={this.state.sysArray} sys={this.state.sys} 
					onQuery={this.handleQueryInput} submitQuery={this.queryCourts} 
					uiDisabled={this.state.uiDisabled} />
				<FilterForm courtNms={this.state.courtNms} dpts={this.state.dpts} courtKds={this.state.courtKds}
					filterCourtNm={this.state.filterCourtNm} filterDpt={this.state.filterDpt} filterCourtKd={this.state.filterCourtKd}
					onFilter={this.handleFilterInput} onCourtKDClick={this.onCourtKDClick} uiDisabled={this.state.uiDisabled} 
					onShowSessTimeClick={this.onShowSessTimeClick} isShowSessTime={this.state.isShowSessTime} 
					sortData={this.sortData} filterText={this.filterText} 
					filterAmTime={this.state.filterAmTime} onAmTimeClick={this.onAmTimeClick}/>
				{/*<LoadingComp isloading={this.state.isloading} />*/}
				{result}
				<span id="addeventatc-block" className={"btn btn-default" + (this.state.mode!='List' ? " hidden" : "")}>
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
		$('.nav a').on('click', function(){
		    $('.btn-navbar').click(); //bootstrap 2.x
		    $('.navbar-toggle').click() //bootstrap 3.x by Richard
		});
        return (
		    <nav className="navbar navbar-fixed-top">
		        <div className="container">
		            <div className="navbar-header">
		                <button type="button" className="navbar-toggle collapsed btn" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
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
	  		var days = 14;
	  		var parameters = {
	  			dateFormat:"yy-mm-dd",
	  			showButtonPanel: true,
	  			firstDay: 0
	  		};
	    	$( "#datepicker1" ).datepicker(parameters).datepicker("setDate", today);
	    	today.setDate(today.getDate() + days);//預設加上N天
	    	$( "#datepicker2" ).datepicker(parameters).datepicker("setDate", today);
	    	//避免移動裝置鍵盤跳出
	    	$('#datepicker1,#datepicker2').on('focus', function(e) {
    			e.preventDefault();
    			$(this).blur();
			});

	  	});
	  	/*
	  	$(function() {
	        $( "#accordion" ).accordion({
	            collapsible: true,
	            active: false
	        });
	    });
	    */
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
		var pos = this.props.crtids.map(function(tmp) {return tmp.crtid;}).indexOf(this.props.crtid);
		if( this.props.crtids[pos]){
			var info = <address className="information"><span className="glyphicon glyphicon-home"></span> {this.props.crtids[pos].address}<br/><abbr title="Phone"><span className="glyphicon glyphicon-earphone"></span></abbr> {this.props.crtids[pos].phone}</address>;
		}
		return (
			<div className="content">
				<h4></h4>
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
						<button type="button" data-toggle="collapse" data-target="#demo" className="btn btn-default" >更多資訊</button>
						<div id="demo" className="collapse">
	                    	<input type="text" ref="date1" id="datepicker1" placeholder="開始日期" className="form-control"/>
	                    	<label>至</label>
	                    	<input type="text" ref="date2" id="datepicker2" placeholder="結束日期" className="form-control"/>
	                    	{info}               	
                    	</div>
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
  	handleShowSessTimehange: function(e){
  		this.props.onShowSessTimeClick(e.target);
  	},
  	handleCourtKDChange: function(e){
  		this.props.onCourtKDClick(e.target);
  	},
  	handleAmTimeChange: function(e){
  		this.props.onAmTimeClick(e.target);
  	},

  	filterTextChange:function(e){
  		var str = e.target.value.trim();
  		//if(str){
  			var array = str.split(" ");
  			this.props.filterText(array);
  		//}
  	},
	render: function() {
		var courtNmNodes = this.props.courtNms.map(function(courtNm){
			return(<option key={courtNm.courtid} value={courtNm.courtnm}>{courtNm.courtnm}</option>);
		});
		var dptNodes = this.props.dpts.map(function(dpt){
			return(<option key={dpt} value={dpt}>{dpt}</option>);
		});
		var courtKdNodes = this.props.courtKds.map(function(courtKd){
			return(<label key={courtKd}><input key={courtKd} type="checkbox" ref="courtKdInput" forName="courtKdInput" onChange={this.handleCourtKDChange} value={courtKd} checked={this.props.filterCourtKd[courtKd]} />{courtKd}</label>);
		}.bind(this));

		var amTimeNodes = amTimes.map(function(time){
			return(<label key={time}><input key={time} type="checkbox" ref="timeInput" forName="timeInput" onChange={this.handleAmTimeChange} value={time} checked={this.props.filterAmTime[time]} />{time}</label>);
		}.bind(this));

		//UI Disable
		var opts={};
		if (this.props.uiDisabled) {
            opts['disabled'] = 'disabled';
        }
		return (
			<div className="content">
				<h4>篩選</h4>
				<form >
					<div className="form-group form-inline">
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
					</div>
					<div ref="kddiv" className="form-group form-inline">
						{courtKdNodes}
					</div>
					<div className="form-group" >
						<input ref="searchText" type="text" className="form-control" placeholder="請輸入年度、字別、案號、法庭或股別，以空白分隔，例如 105 訴 128" onChange={this.filterTextChange}  data-toggle="tooltip" data-placement="top" title="請輸入年度、字別、案號、法庭或股別，以空白分隔，例如 105 訴 128" {...opts}/>
					</div>
					<div className="form-group form-inline">
						<button ref="sortBtn" type="button" className="btn btn-warning" onClick={this.props.sortData} {...opts}>找空庭嗎? (依法庭排序)</button> {amTimeNodes} 
						<label><input type="checkbox" onChange={this.handleShowSessTimehange} checked={this.props.isShowSessTime} />顯示開閉庭時間</label>
					</div>
				</form>
			</div>
		);
	}
});


//案件清單
var CourtList = React.createClass({
	
	getInitialState: function() {
        return {
			isShowMore:false,
			endPos:100,
			dataCount:100,
        };
    },
	showMoreData: function(){
		var endPos = this.state.endPos+this.state.dataCount;
		this.setState({endPos:endPos});
		if(this.props.data.length>endPos && !this.state.isShowMore){
			this.setState({isShowMore:true});
		}else if(this.props.data.length<=endPos && this.state.isShowMore){
			this.setState({isShowMore:false});
		}
	},
	// componentWillUpdate:function(){
	// 	console.log("componentWillUpdate");
	// 	console.log(this.props.data.length + " " + this.state.endPos + " " + this.state.isShowMore);
	// 	// if(this.props.data.length>this.state.endPos && !this.state.isShowMore){
	// 	// 	this.setState({isShowMore:true});
	// 	// }else if(this.props.data.length<=this.state.endPos && this.state.isShowMore){
	// 	// 	this.setState({isShowMore:false});
	// 	// }		
	// },
	//載入完資料後檢查是否需要有顯示更多的按鈕
	componentDidUpdate:function(){
		//$(document).ready(function(){
		    $('[data-toggle="tooltip"]').tooltip();//顯示提示
		    if(isShowToooltips){
		    	setTimeout( function(){$('#calimg').tooltip('show')}, 2000);//不能立刻顯示，否則jquery還沒載入完成tooltips
			    setTimeout( function(){$('#calimg').tooltip('hide')}, 12000);
			    //setTimeout( function(){alert('123')}, 500);
			    isShowToooltips=false;
			}
		//});
		//console.log("componentDidUpdate");
		//console.log(this.props.data.length + " " + this.state.endPos + " " + this.state.isShowMore);
		if(this.props.data.length>this.state.endPos && !this.state.isShowMore){
			this.setState({isShowMore:true});
		}else if(this.props.data.length<=this.state.endPos && this.state.isShowMore){
			this.setState({isShowMore:false});
		}			
	},
	//切換模式後，需再檢查是否需要有顯示更多的按鈕
	componentWillMount:function(){
		//console.log("componentWillMount");
		//console.log(this.props.data.length + " " + this.state.endPos + " " + this.state.isShowMore);
		if(this.props.data.length>this.state.endPos && !this.state.isShowMore){
			this.setState({isShowMore:true});
		}					
	},
	// componentDidMount:function(){
	// 	console.log("componentDidMount");	
	// },	
	// componentWillReceiveProps:function(){
	// 	console.log("componentWillReceiveProps");	
	// },	

	mapFunction: function(court){
			var today = new Date();
			return(
				<Court key={court.num} court={court} isToday={court.realDate.isSame(today,"day")} onSelectRadio={this.props.onSelectRadio} isShowSessTime={this.props.isShowSessTime}></Court>
			); 
		},
	render: function() {
		var btnClass = "";
		//console.log(this.state.isShowMore);
		if(!this.state.isShowMore){
			btnClass = " hidden";
		}
		//console.log('out:'+this.props.filterCourtNm);
		//var filterCourtNm = this.props.filterCourtNm.trim();
		//console.log(this.props.data);
		var courtNodes = this.props.data.filter(function(court, index) { return index<this.state.endPos; }.bind(this)).map(this.mapFunction);
		return (
			<div className="">
				<div className="content">{courtNodes.length}件/共{this.props.data.length}件</div>
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
						<td><img src="image/calendar-clock24.png" alt="" id="calimg" data-toggle="tooltip" data-placement="top" title="選取一個庭期後，點選右上方角落的按鈕加入你的行事曆" /></td>
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
				<button ref="showMoreBtn" type="button" className={"btn btn-default"+btnClass} onClick={this.showMoreData}>顯示更多庭期</button>
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
				<td>{this.props.court.crmyy}</td>
				<td>{this.props.court.crmid}</td>
				<td>{Number(this.props.court.crmno)}</td>
				<td>{this.props.court.courtdate.insert(3," ")}</td>	
				<td>{this.props.court.courtime.insert(2,":")}<Status isToday={this.props.isToday} court={this.props.court} isShowSessTime={this.props.isShowSessTime}/></td>
				<td>{this.props.court.courtnm}</td>
				<td>{this.props.court.dpt}</td>
				<td>{this.props.court.courtkd}</td>
				<td>
					<input type="radio" name="calRadios" value={this.props.court.num} onChange={this.props.onSelectRadio}/>
				</td>
				{/*
				<td>{this.props.courtid}</td>
				<td>{this.props.crtid}</td>	
				*/}			
			</tr>
		);
	}	
});

//顯示開庭進度圖示
var Status = React.createClass({
	render() {
		var status = null;
		var statusNew = "";
		var statusStartTime = "";
		var statusEndTime = "";
		if(this.props.isToday){
			if(typeof this.props.court.status != "undefined"){
				status = <img src={"image/"+statusPic[this.props.court.status]} alt={this.props.court.status} title={this.props.court.status} clasName="" />;
			}
			if(typeof this.props.court.newadd != "undefined"){
				statusNew = <img src={"image/plus.png"} alt="臨時新增" title="臨時新增" clasName="" />;
			}
			if(this.props.isShowSessTime){
				//console.log(this.props.court.rstarttm);
				if((typeof this.props.court.rstarttm != "undefined") && this.props.court.rstarttm){
					statusStartTime = <span className="sesstags color1">{this.props.court.rstarttm.insert(2,":")}</span>;
    				
    			}
    			//console.log(this.props.court.rstoptm);
    			if((typeof this.props.court.rstoptm != "undefined") && this.props.court.rstoptm){
					statusEndTime = <span className="sesstags color2">{this.props.court.rstoptm.insert(2,":")}</span>;
    				
    			}
			}
			status = <span>{status}{statusNew} {statusStartTime}{statusEndTime}</span>;
		}
		return (
			 status
		);
	}
});


/*
	ref:
	http://chrisharrington.github.io/demos/react-controls/calendar.html
*/
var Calerdar = React.createClass({
	getInitialState: function() {
        return {
            month: this.props.selected.clone(),
            selected : this.props.selected
        };
    },

    previous: function() {
        var month = this.state.month;
        month.add(-1, "M");
        this.setState({ month: month });
    },

    next: function() {
        var month = this.state.month;
        month.add(1, "M");
        this.setState({ month: month });
    },

    select: function(day) {
        this.setState({selected:day.date});
        this.forceUpdate();
    },
    renderWeeks: function() {
        var weeks = [],
            done = false,
            date = this.state.month.clone().startOf("month").add("w" -1).day("Sunday"),
            monthIndex = date.month(),
            count = 0;
            //AMCut = 1300;//上下午時段切割點
        while (!done) {
        	//上午
            weeks.push(<Week key={date.toString()+"_AM"} isAM={true} isShowSessTime={this.props.isShowSessTime} date={date.clone()} month={this.state.month} select={this.select} 
            	selected={this.state.selected} data={this.props.data.filter(function(court) { return Number(court.courtime)<AMCut; })} />);
            //下午
            weeks.push(<Week key={date.toString()+"_PM"} isAM={false} isShowSessTime={this.props.isShowSessTime} date={date.clone()} month={this.state.month} select={this.select} 
            	selected={this.state.selected} data={this.props.data.filter(function(court) { return Number(court.courtime)>AMCut; })} />);            
            date.add(1, "w");
            done = count++ > 2 && monthIndex !== date.month();
            monthIndex = date.month();
        }

        return weeks;
    },
    renderMonthLabel: function() {
    	moment.locale('zh-tw');
        return <span>{this.state.month.format("MMMM, YYYY")}</span>;
    },
	render: function() {
    return (
    	<div id="calendar">
			<div className="header">
                <i className="fa fa-angle-left" onClick={this.previous}></i>
                {this.renderMonthLabel()}
                <i className="fa fa-angle-right" onClick={this.next}></i>
            </div>
            <table>
            <thead><DayNames /></thead>
      		<tbody>
            {this.renderWeeks()}
            </tbody>
            </table>
    	</div>
    	);
	}
});

var DayNames = React.createClass({
    render: function() {
        return <tr className="week names">
            <td className="day">日</td>
            <td className="day">一</td>
            <td className="day">二</td>
            <td className="day">三</td>
            <td className="day">四</td>
            <td className="day">五</td>
            <td className="day">六</td>
        </tr>;
    }
});

var Week = React.createClass({
    render: function() {
        var days = [],
            date = this.props.date,
            month = this.props.month;

        for (var i = 0; i < 7; i++) {
            var day = {
                name: date.format("dd").substring(0, 1),
                number: date.date(),
                isCurrentMonth: date.month() === month.month(),
                isToday: date.isSame(new Date(), "day"),
                date: date
            };
            days.push(<td key={day.date.toString()} className={"day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : "")} 
            	onClick={this.props.select.bind(null, day)}>{(this.props.isAM ? day.number : "")}
            	<Event key={day.date.toString()} data={this.props.data} day={day} isAM={this.props.isAM} isShowSessTime={this.props.isShowSessTime}/>
            	</td>);
            date = date.clone();
            date.add(1, "d");

        }

        return <tr className={"week" + (!this.props.isAM ? " PM" : "")} key={days[0].toString()}>
            {days}
        </tr>
    }
}); 
var Event = React.createClass({
	render: function() {
		var day = this.props.day;
		var events=$.grep(this.props.data, function(court){ return court.realDate.isSame(day.date, "day");});
		var today = new Date();
		var isToday = this.props.day.isToday;
		var eventNodes = events.map(function(court){
							return <div key={court.num} className={"event"+ (!this.props.isAM ? " PM" : "")}>{court.courtime.insert(2,":") + " " + Number(court.courtid) + " " + 
							court.dpt + "股 " + court.crmyy  + "" + court.crmid  + "" + Number(court.crmno) + " " + 
							court.courtkd}<Status isToday={isToday} court={court} isShowSessTime={this.props.isShowSessTime}/></div>
						}.bind(this));
		
		var countLabel = ( (eventNodes.length>0)?"共"+eventNodes.length+"件":"");
        return <div>{countLabel}{eventNodes}</div>
    }
});  

var Contact  = React.createClass({
	render: function() {
		return (
			<div className="license">
				<a rel = "license" href = "http://creativecommons.org/licenses/by-nc/4.0/">
				<img alt = "Creative Commons License" src = "https://i.creativecommons.org/l/by-nc/4.0/88x31.png" />
				</a><br />
				<span property = "dct:title"> Taiwan Court Session Management System </span> by 
				<span property="cc:attributionName"> Morris Yang </span> <br />
				Docs is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">
				Creative Commons Attribution-NonCommercial 4.0 International License</a>.<br />
				Code is licensed under a <a rel="license" href="https://opensource.org/licenses/MIT">the MIT license</a>.<br />
				Taiwan Taoyuan District Court
			</div>
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
function getCourtUrl(crtid, sys, dateBegin, dateEnd){
	if(!dateBegin || !dateEnd){
		dateBegin = '';
		dateEnd = '';
	}
	if(!crtid || !sys){//empty
		return;
	}
	return "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_COURTDATA.jsp%3Fcrtid%3D"+crtid+"%26sys%3D"+sys+"%26date1%3D"+dateBegin+"%26date2%3D"+dateEnd+"%26timstamp%3D"+ (new Date()).getTime() +"'&format=json&callback=";
};

//取得庭期狀態查詢的URL
/*
    "crmid": "易",
    "crmkd": "H",
    "crmno": "000366",
    "crmyy": "105",
    "crtcd": "TYD",
    "crtnm": "臺灣桃園地方法院",
    "dpt": "約",
    "ducd": "0006",
    "dudt": "1050620",
    "dukd": "準備程序",
    "dunm": "刑事第六法庭",
    "dutm": "0930",
    "issendtencing": "",
    "rstarttm": "",
    "rstoptm": "",
    "status": "待開庭"
    待開庭
    開完庭
	開庭中
	下一庭
	未開庭
*/
/*timestamp參數是為了避免YQL使用cache輸出舊的資料*/
function getSessionStateUrl(crtid, sys, courtid){
	if(!crtid || !sys || !courtid){//empty
		return;
	}
	//return "http://210.69.124.207/abbs/wkw/WHD_PDA_GET_CTSTATE.jsp?crtid="+crtid+"&sys="+sys+"&ducd="+courtid;
	return "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_CTSTATE.jsp%3Fcrtid%3D"+crtid+"%26sys%3D"+sys+"%26ducd%3D"+courtid+"%26timstamp%3D"+ (new Date()).getTime() +"%22&format=json&callback=";
	//return "https://jsonp.afeld.me/?url=http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_CTSTATE.jsp%3Fcrtid%3D"+crtid+"%26sys%3D"+sys+"%26ducd%3D"+courtid;
};

function isfilterMatch(court, filterCourtNm, filterDpt, filterCourtKdMap, filterTextArray, filterAmTimeflag){
		/*
		var filterCourtNm = this.props.filterCourtNm.trim();
		var filterDpt = this.props.filterDpt.trim();
		*/
		
		//console.log(str);
		//搜尋字串
		var isMatchText = true;
		if(filterTextArray.length>0){
			//把資料串成字串
			var str="";
			for (var attrname in searchAttribute) { 
				if(searchAttribute.hasOwnProperty(attrname)){
					str=str+court[searchAttribute[attrname]]; 
				}
			}
			//onsole.log(filterTextArray.length);
			for(var i in filterTextArray){
				if(filterTextArray.hasOwnProperty(i) && str.indexOf(filterTextArray[i])<0){
					//console.log(filterTextArray[i] + " "+ str.indexOf(filterTextArray[i]));
					isMatchText = false;
					break;
				}
			}
		}
		var isMatchTime = true;
		if(filterAmTimeflag>0){
			isMatchTime = court.courtime < AMCut;
		}else if(filterAmTimeflag<0){
			isMatchTime = court.courtime > AMCut;
		}
		

		return (!filterCourtNm || court.courtnm === filterCourtNm) && (!filterDpt || court.dpt === filterDpt) && filterCourtKdMap[court.courtkd] && isMatchText && isMatchTime;
}

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
function getUniqueList(array, property) {
    var unique = {};
    var distinct = [];
    for (var i in array) {
        if (typeof(unique[array[i][property]]) == "undefined") {
        	if( array.hasOwnProperty(i) ){
            	distinct.push(array[i][property]);
        	}
        }
        unique[array[i][property]] = 0;
    }
    return distinct;
};

//取法庭ID跟名稱
function getNMList(array) {
    var unique = {};
    var distinct = [];
    for (var i in array) {
        if (typeof(unique[array[i]["courtnm"]]) == "undefined") {
        	if( array.hasOwnProperty(i) ){
	            distinct.push({
	                "courtid": array[i]["courtid"],
	                "courtnm": array[i]["courtnm"]
	            });
	        }
        }
        unique[array[i]["courtnm"]] = 0;
    }
    return distinct;
};

//取出不重複清單(多欄位)，效能較差不建議使用
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

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function deleteCookie(cname) {
  document.cookie = cname + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/*
	Array使用了property會造成資料多增加一筆，儲存內容為此function
	可用 array.hasOwnProperty(i) 檢測該索引是否為原形本身就有的屬性。
	Ref:
	http://stackoverflow.com/questions/1107681/javascript-hiding-prototype-methods-in-for-loop
*/
Array.prototype.getNameByIndex = function (value, findCol, returnCol){
	var tmp = $.grep(this, function(e){ return e[findCol] == value;});
	return tmp[0][returnCol];
};

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

var statusPic = {
	"待開庭":"status-offline.png",
	"開完庭":"status.png",
	"開庭中":"status-busy.png",
	"下一庭":"status-offline.png",
	"未開庭":"status-offline.png",
	"未聽判":"status-offline.png"
};

var searchAttribute = [
	"crmyy",
	"crmid",
	"crmno",
	"courtnm",
	"dpt"
];
var amTimes = [
	"上午",
	"下午"
];

var AMCut = 1300,
	isShowToooltips = true;
/*
cross domain處理YQL
http://clayliao.blogspot.tw/2011/03/yqlintroduxtion.html
*/
//http://210.69.124.207/abbs/wkw/WHD_PDA_GET_COURTDATA.jsp?crtid=TYD&sys=H
ReactDOM.render(
	<CourtBox pollInterval={180000}/>,
	document.getElementById('content')
);
