var CourtBox = React.createClass({
	getInitialState: function(){
		return {
			data:[],
			filterCourtNm: '',//法庭
			courtNms:[],//法庭清單
			crtid:'',//法院
			sys:''//庭別
		};
	},
	//設定篩選參數
	handleFilterInput: function(filterCourtNm){
		this.setState({
			filterCourtNm: filterCourtNm
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
	queryCourts: function(crtid, sys){
		//console.log(this.state.crtid+ this.state.sys);
		//console.log(crtid+sys);
		this.loadCourtsFromServer(crtid, sys);
		this.setState({
			crtid: crtid,
			sys: sys,
			filterCourtNm: ''
		});
	},
	//讀取資料
	loadCourtsFromServer: function(crtid, sys){
		var url = getCourtUrl(crtid,sys);
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
					this.setState({courtNms:nm});
					//console.timeEnd("concatenation");
					//console.log(nm);
					addSctollTop();
				}else{
					console.log("Courts is empty.");
					this.setState({data:[], courtNms:[]});
				}
			}.bind(this),
			error: function(xhr, status, err){
				console.error(url, status, err.toString());
			}.bind(this)

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
				<QueryForm crtid={this.state.crtid} sys={this.state.sys} onQuery={this.handeleQueryInput} submitQuery={this.queryCourts} />
				<FilterForm courtNms={this.state.courtNms} filterCourtNm={this.state.filterCourtNm} onFilter={this.handleFilterInput} />
				<CourtList data={this.state.data} filterCourtNm={this.state.filterCourtNm} />
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
		this.props.submitQuery(this.refs.crtidInput.value, this.refs.sysInput.value);
		e.preventDefault();//要先取消避免刷新頁面
		this.refs.submitbtn.blur();
	},
	render: function() {
		return (
			<div className="content">
				<h4>查詢</h4>
				<form onSubmit={this.handleSubmit} className="form-inline">
					<div className="form-group">
					<select ref="crtidInput" onChange={this.handleQueryChange} className="form-control" value="TYD">
						<option value="TPD">臺灣臺北地方法院</option>
						<option value="TYD">臺灣桃園地方法院</option>
						<option value="CLE">臺灣桃園地方法院中壢簡易庭</option>
						<option value="TYE">臺灣桃園地方法院桃園簡易庭</option>			
					</select>
					</div>
					<div className="form-group">
					<select ref="sysInput" onChange={this.handleQueryChange} className="form-control" value="H">
						<option value="V">民事</option>
						<option value="H">刑事</option>
						<option value="I">少年</option>
						<option value="A">行政</option>			
					</select>
					</div>
					<button ref="submitbtn" type="submit" className="btn btn-default">查詢</button>
				</form>
			</div>
		);
	}
});


//過濾條件
var FilterForm = React.createClass({
	handleFilterChange: function(e) {
    	this.props.onFilter(
    		e.target.value
    	);
  	},
	render: function() {
		var courtNmNodes = this.props.courtNms.map(function(courtNm){
			return(<option value={courtNm}>{courtNm}</option>)
		});
		return (
			<div className="content">
				<h4>篩選</h4>
				<form>
					<select onChange={this.handleFilterChange} className="form-control" value={this.props.filterCourtNm}>
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
				</form>
			</div>
		);
	}
});

//案件清單
var CourtList = React.createClass({
	render: function() {
		//console.log('out:'+this.props.filterCourtNm);
		var filterCourtNm = this.props.filterCourtNm.trim();
		var courtNodes = this.props.data.map(function(court){
			if(!filterCourtNm){			
				return(
					<Court key={court.num} num={court.num} sys={court.sys} crmyy={court.crmyy}
						crmid={court.crmid} crmno={court.crmno} courtdate={court.courtdate}
						courtime={court.courtime} courtnm={court.courtnm} dpt={court.dpt}
						courtkd={court.courtkd} courtid={court.courtid} crtid={court.crtid}>
					</Court>
				); 
			}else{
				if(court.courtnm === filterCourtNm){
					return(
						<Court key={court.num} num={court.num} sys={court.sys} crmyy={court.crmyy}
							crmid={court.crmid} crmno={court.crmno} courtdate={court.courtdate}
							courtime={court.courtime} courtnm={court.courtnm} dpt={court.dpt}
							courtkd={court.courtkd} courtid={court.courtid} crtid={court.crtid}>
						</Court>
					); 
				}
			}
		});
		return (
			<div className="content">
				<table className="table table-bordered table-striped">
					<thead>
					<tr>
						<td>序號</td>
						{/*
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
				<td>{this.props.num}</td>
				{/*
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

//取得法院查詢的YQL URL
function getCourtUrl(crtid, sys){
	if(!crtid || !sys){//empty
		return;
	}
	return "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_COURTDATA.jsp%3Fcrtid%3D"+crtid+"%26sys%3D"+sys+"'&format=json&callback="
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

/*
cross domain處理YQL
http://clayliao.blogspot.tw/2011/03/yqlintroduxtion.html
*/
//http://210.69.124.207/abbs/wkw/WHD_PDA_GET_COURTDATA.jsp?crtid=TYD&sys=H
ReactDOM.render(
	<CourtBox pollInterval={200000}/>,
	document.getElementById('content')
);