var CourtBox = React.createClass({
	getInitialState: function(){
		return {
			data:[],
			filterCourtNm: '',//法庭
			filterDpt:'',
			courtNms:[],//法庭清單
			dpts:[],
			crtid:'TYD',//法院
			sys:'H',//庭別
			isloading: false,//是否讀取中
			uiDisabled: false
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
	handeleQueryInput: function(crtid, sys){
		this.setState({
			crtid: crtid,
			sys: sys,
		});
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
			filterCourtNm: ''
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
				if(array){
					this.setState({data:array});
					//console.log(data.query.results.DATA.rowid);
					//console.log(data.query.results.DATA);
					
					//console.time("concatenation");
					/*
					//此方法效能不佳
					var nm = array.map(function(obj) { return obj.courtnm; });
					nm = nm.filter(function(v,i) { return nm.indexOf(v) == i; });
					*/
					var nm = getUniqueList(array,"courtnm");//取出不重複法庭
					nm.sort();
					var dpt = getUniqueList(array,"dpt");//取出不重複股別
					dpt.sort();
					this.setState({courtNms:nm, dpts:dpt});
					//console.timeEnd("concatenation");
					//console.log(nm);
					addSctollTop();
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
	//componentDidMount is a method called automatically by React after a component is rendered for the first time. 
	componentDidMount: function(){
		//console.log('test');
		//this.loadCourtsFromServer("TYD","H");
		//setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function(){
		return (
			<div className="queryBox">
				<QueryForm crtid={this.state.crtid} sys={this.state.sys} onQuery={this.handeleQueryInput} submitQuery={this.queryCourts} uiDisabled={this.state.uiDisabled} />
				<FilterForm courtNms={this.state.courtNms} dpts={this.state.dpts}  filterCourtNm={this.state.filterCourtNm} filterDpt={this.state.filterDpt} onFilter={this.handleFilterInput} uiDisabled={this.state.uiDisabled} />
				{/*<LoadingComp isloading={this.state.isloading} />*/}
				<CourtList data={this.state.data} filterCourtNm={this.state.filterCourtNm} filterDpt={this.state.filterDpt}/>
			</div>
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
	    	$( "#datepicker1" ).datepicker({dateFormat:"yy-mm-dd"}).datepicker("setDate", today);
	    	today.setDate(today.getDate() + days);//預設加上N天
	    	$( "#datepicker2" ).datepicker({dateFormat:"yy-mm-dd"}).datepicker("setDate", today);
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
		return (
			<div className="content">
				<h4>查詢</h4>
				<form onSubmit={this.handleSubmit}>
					<div className="form-group form-inline">
						<div className="form-group">
							<select ref="crtidInput" onChange={this.handleQueryChange} className="form-control" value={this.props.crtid}>
								<option value="TPD">臺灣臺北地方法院</option>
								<option value="TYD">臺灣桃園地方法院</option>
								<option value="CLE">臺灣桃園地方法院中壢簡易庭</option>
								<option value="TYE">臺灣桃園地方法院桃園簡易庭</option>			
							</select>
						</div>
						<div className="form-group">
							<select ref="sysInput" onChange={this.handleQueryChange} className="form-control" value={this.props.sys}>
								<option value="V">民事</option>
								<option value="H">刑事</option>
								<option value="I">少年</option>
								<option value="A">行政</option>			
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
			return(<option value={courtNm}>{courtNm}</option>)
		});
		var dptNodes = this.props.dpts.map(function(dpt){
			return(<option value={dpt}>{dpt}</option>)
		});
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
	test: function(court){
		var filterCourtNm = this.props.filterCourtNm.trim();
		var filterDpt = this.props.filterDpt.trim();
		return (!filterCourtNm || court.courtnm === filterCourtNm) && (!filterDpt || court.dpt === filterDpt);
	},
	render: function() {
		//console.log('out:'+this.props.filterCourtNm);
		var filterCourtNm = this.props.filterCourtNm.trim();
		var courtNodes = this.props.data.filter(this.test).map(function(court){
			return(
				<Court key={court.num} num={court.num} sys={court.sys} crmyy={court.crmyy}
					crmid={court.crmid} crmno={court.crmno} courtdate={court.courtdate}
					courtime={court.courtime} courtnm={court.courtnm} dpt={court.dpt}
					courtkd={court.courtkd} courtid={court.courtid} crtid={court.crtid}>
				</Court>
			); 
		});
		return (
			<div className="content">
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
courtnm:"刑事調解庭(一)"
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
				<td>{this.props.courtime}</td>
				<td>{this.props.courtnm}</td>
				<td>{this.props.dpt}</td>
				<td>{this.props.courtkd}</td>
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
function addSctollTop() {
    // Only enable if the document has a long scroll bar
    // Note the window height + offset
    if (($(window).height() + 100) < $(document).height()) {
        $('#top-link-block').removeClass('hidden').affix({
            // how far to scroll down before link "slides" into view
            offset: {
                top: 100
            }
        });
    }
};

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

function ADtoROC(ADdate){
	var ADdateStr = ADdate.toString().replace(/-/g,'');//刪除-
	var ROCdate = parseInt(ADdateStr.substring(0,4))-1911 + ADdateStr.substring(4);//西元轉民國
	return ROCdate;
}

/*
cross domain處理YQL
http://clayliao.blogspot.tw/2011/03/yqlintroduxtion.html
*/
//http://210.69.124.207/abbs/wkw/WHD_PDA_GET_COURTDATA.jsp?crtid=TYD&sys=H
ReactDOM.render(
	<CourtBox pollInterval={200000}/>,
	document.getElementById('content')
);