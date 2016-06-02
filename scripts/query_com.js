var CourtBox = React.createClass({
	getInitialState: function(){
		return {data:[]};
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
		setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function(){
		return (
			<div className="queryBox">
				<h1>法院庭期查詢</h1>
				<QueryForm />
				<CourtList data={this.state.data} />
			</div>
		);
	}
});

var QueryForm = React.createClass({
	render: function() {
		return (
			<h2>Query</h2>
		);
	}
});

var CourtList = React.createClass({
	render: function() {
		var courtNodes = this.props.data.map(function(court){
			return(
				<Court num={court.num} sys={court.sys} crmyy={court.crmyy}
					crmid={court.crmid} crmno={court.crmno} courtdate={court.courtdate}
					courtime={court.courtime} courtnm={court.courtnm} dpt={court.dpt}
					courtkd={court.courtkd} courtid={court.courtid} crtid={court.crtid}>
				</Court>
			); 
		});
		return (
			<table>
				{courtNodes}
			</table>
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

ReactDOM.render(
	<CourtBox url="https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2F210.69.124.207%2Fabbs%2Fwkw%2FWHD_PDA_GET_COURTDATA.jsp%3Fcrtid%3DTYD%26sys%3DH'&format=json&callback=" pollInterval={200000}/>,
	document.getElementById('content')
);
