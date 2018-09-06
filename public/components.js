Vue.filter('date', function (value) {
  return value ? new Date(value).toLocaleString() : null;
})

Vue.filter('round', function (num) {
  return Math.round(num * 100) / 100;
})

Vue.filter('colorcode', function (num) {
  let colorClass = '';
  if (num > 0) {
    colorClass = 'success'
  } else if (num < 0) {
    colorClass = 'danger'
  }
  return 'text-' + colorClass;
})


let summaryTable = Vue.component('summary-table', {
  props: ['summary'],
  data: function() {
    return {
    	showBad: false
    };
  },
  computed: {
  	computedSummary() {
  		if (this.showBad === 'all') {
  			return this.summary
  		}
  		return this.summary.filter(item => item.bad === this.showBad)
  	}
  },
  methods: {
    onClick($event) {
      this.$emit('selected', $event);
    },
    toggleBadStocks() {
      if (this.showBad === 'all') {
        this.showBad = true
      } else if (this.showBad === true) {
        this.showBad = false
      } else if (this.showBad === false) {
        this.showBad = 'all'
      };
    }
  },
  template: `
    <table class="table table-sm table-hover summary-table text-center ">
        <thead>
            <tr>
              <th>Symbol</th>
              <th class="bad-filter-header" @click="toggleBadStocks()">
                <button :class="{
                    'btn-success': showBad === false,
                    'btn-danger': showBad === true,
                    'btn-warning': showBad === 'all'
                  }" class="badge btn-sm">Bad</button> 
              </th>
              <th>Hot @ Time</th>
              <th>Cold @ Time</th>
              <th>Market Open</th>
              <th>Cold Close</th>
              <th>High</th>
              <th>Low</th>
              <th>HOT-COLD %Change</th>
              <th>High %Change</th>
            </tr>
        </thead>
        <tbody>
            <tr @click="onClick(item.stock)" v-for="item in computedSummary">
                  <td>
                    <a target="_blank" :href="'https://finviz.com/quote.ashx?t=' + item.stock">{{item.stock}}</a>
                  </td>
                  <td>{{item.bad}}</td>
                  <td>{{item.startTime | date}}</td>
                  <td>{{item.endTime | date}}</td>
                  <td>{{item.open}}</td>
                  <td>{{item.close}}</td>
                  <td>{{item.high}}</td>
                  <td>{{item.low}}</td>
                  <td :class="item.percentChange | colorcode">{{item.percentChange | round}}</td>
                  <td>{{item.highPercentChange | round}}</td>
                </tr>
            </tr>
        </tbody>
    </table>`
});

let pricesTable = Vue.component('prices-table', {
  props: ['prices'],
  data: function() {
    return {};
  },
  computed: {},
  template: `
    <table class="table table-sm table-hover summary-table text-center">
        <thead>
            <tr>
              <th>Symbol</th>
              <th>Time</th>
              <th>Last</th>
              <th>Open</th>
              <th>Percent Change</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in prices">
                  <td>{{item.sym}}</td>
                  <td>{{item.time | date}}</td>
                  <td>{{item.last}}</td>
                  <td>{{item.open}}</td>
                  <td :class="item.percentChange | colorcode">{{item.percentChange | round}}</td>
                </tr>
            </tr>
        </tbody>
    </table>`
});
