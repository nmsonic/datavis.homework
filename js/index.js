const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('input', function(){
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){
        rParam = d3.select(this).property('value');
        updateBar();
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateBar();
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){
        yParam = d3.select(this).property('value');
        updateBar();
        updateScattePlot();
    });

    d3.select('#param').on('change', function(){
        param = d3.select(this).property('value');
        updateBar();
        updateScattePlot();

    });
function updateBar(){
    let regions = d3.set(data.map(d=>d.region)).values();

    let data_mean = regions.map(region =>{
        return {'region':region,
        'mean':d3.mean(data.filter(d => d.region == region).map(d => d[param][year]))}
      });
        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));

        yBar.domain([0, d3.max(data_mean.map(d => d.mean))]);
        yBarAxis.call(d3.axisLeft(yBar));

    barChart.selectAll('rect').remove();
    barChart.selectAll('rect').data(data_mean)
        .enter()
        .append('rect')
        .attr('x', d => xBar(d['region']))
        .attr("region", d => d['region'])
        .attr('y', d => yBar(d['mean']))
        .attr("width", xBar.bandwidth())
        .attr("height", function(d) { return height - margin- yBar(d.mean); })
        .style("fill", d => colorScale(d['region']))
        .on('click', function(d){
            var element = d3.select(this);
            barChart.selectAll('rect').attr('opacity', 0.5);
            element.attr('opacity', 1);
            updateScattePlot();
            scatterPlot.selectAll('circle')
            .filter(d => d.region != element.attr('region'))
            .style('opacity', 0);
        });
        return;
    }
function updateScattePlot(){

    let xRange = data.map(d=> +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);
        xAxis.call(d3.axisBottom(x));

    let yRange = data.map(d => +d[yParam][year]);
        y.domain([d3.min(yRange), d3.max(yRange)]);
        yAxis.call(d3.axisLeft(y));

    let rRange = data.map(d => +d[rParam][year]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)]);
    scatterPlot.selectAll('circle').remove();
    scatterPlot.selectAll('circle').data(data)
              .enter()
              .append('circle')
              .attr("region", d => d['region'])
              .attr("cx", d => x(d[xParam][year]))
              .attr("cy", d => y(d[yParam][year]))
              .attr("r", d => radiusScale(d[rParam][year]))
              .style("fill", d => colorScale(d['region']));
        return;
    }

    updateBar();
    updateScattePlot();
});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}
