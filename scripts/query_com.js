var CourtBox = React.createClass({
	getInitialState: function(){
		return {
			data:[],
			filterCourtNm: ''
		};
	},
	handleFilter: function(filterCourtNm){
		this.setState({
			filterCourtNm: filterCourtNm
		});
	},
	loadCommentsFromServer: function(){
		$.ajax({
			url:this.props.url,
    		crossDomain: true,
    		//dataType: 'jsonp xml',
    		dataType: 'json',
			cache: false,
			success: function(data){
				this.setState({data:data.query.results.DATA.rowid});
				//console.log(data.query.results.DATA.rowid);
				//console.log(data.query.results.DATA);
			}.bind(this),
			error: function(xhr, status, err){
				console.error(this.props.url, status, err.toString());
			}.bind(this)

		});
	},
	//componentDidMount is a method called automatically by React after a component is rendered for the first time. 
	componentDidMount: function(){
		this.loadCommentsFromServer();
		//setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function(){
		return (
			<div className="queryBox">
				<h1>法院庭期查詢</h1>
				<QueryForm filterCourtNm={this.state.filterCourtNm} onFilter={this.handleFilter}/>
				<CourtList data={this.state.data} filterCourtNm={this.state.filterCourtNm}/>
			</div>
		);
	}
});

var QueryForm = React.createClass({
	handleFilterChange: function(e) {
    	this.props.onFilter(
    		e.target.value
    	);
  	},
	render: function() {
		return (
			<div className="content">
				<h4>篩選</h4>
				<form>
					<select onChange={this.handleFilterChange} className="form-control">
						<option value="">所有法庭</option>
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
					</select>
				</form>
			</div>
		);
	}
});

var CourtList = React.createClass({
	render: function() {
		console.log('out:'+this.props.filterCourtNm);
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
				<table className="table table-bordered">
					<thead>
					<tr>
						<td>序號</td>
						<td>類別</td>
						<td>年度</td>
						<td>字別</td>
						<td>案號</td>
						<td>開庭日期</td>	
						<td>開庭時間</td>
						<td>法庭</td>
						<td>股別</td>
						<td>庭類</td>
						<td>法庭</td>
						<td>法院</td>			
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
				<td>{this.props.sys}</td>
				<td>{this.props.crmyy}</td>
				<td>{this.props.crmid}</td>
				<td>{this.props.crmno}</td>
				<td>{this.props.courtdate}</td>	
				<td>{this.props.courtime}</td>
				<td>{this.props.courtnm}</td>
				<td>{this.props.dpt}</td>
				<td>{this.props.courtkd}</td>
				<td>{this.props.courtid}</td>
				<td>{this.props.crtid}</td>			
			</tr>
		);
	}	
});
/*
cross domain處理YQL
http://clayliao.blogspot.tw/2011/03/yqlintroduxtion.html
*/
//http://210.69.124.207/abbs/wkw/WHD_PDA_GET_COURTDATA.jsp?crtid=TYD&sys=H
ReactDOM.render(
	<CourtBox url="https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_COURTDATA.jsp%3Fcrtid%3DTYD%26sys%3DH'&format=json&callback=" pollInterval={200000}/>,
	document.getElementById('content')
);
