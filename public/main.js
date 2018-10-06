// Vue.use(ElementUI);
const app = new Vue({
  el: '#app',
  data: {
    navLinks: [
      { display: 'gateway', url: 'https://big-gateway.glitch.me/' },
      { display: 'mlab', url: 'https://mlab.com/login/' },
      { display: 'st', url: 'https://stocktwits.com/' },
      { display: 'finviz', url: 'https://finviz.com/' },
      { display: 'jsontable', url: 'https://jsontable.glitch.me/' }
    ],
    trending: {},
    summary: [],
    selectedStock: null,
    date: null,
    alertMessage: '',
    start: null,
    end: '9:30',
  },
  mounted() {
    const urlParams = new URLSearchParams(location.search);
    this.start = urlParams.get('start');
    this.end = urlParams.get('end');
    if (urlParams.has('date')) {
      this.date = urlParams.get('date')
    } else {
      const date_ = new Date();
      this.date = `${date_.getFullYear()}-${date_.getMonth() +
        1}-${date_.getDate()}`;
    }
    axios
      .get('/trending', {
        params: {
          date: this.date,
          lowerLimitTime: this.start ? this.start : undefined,
          upperLimitTime: this.end ? this.end : undefined
        }
      })
      .then(d => {
        this.trending = d.data;
        this.summary = this.getSummary(this.trending);
      });
  },
  filters: {
    objkeys(obj) {
      return Object.keys(obj);
    }
  },
  methods: {
    getHigh(arr) {
      if (!arr.length || arr.length === 0) {
        return null;
      }
      let highest = arr[0];
      arr.forEach(item => {
        highest = item.last > highest.last ? item : highest;
      });
      return highest;
    },

    getLow(arr) {
      if (!arr.length || arr.length === 0) {
        return null;
      }
      let lowest = arr[0];
      arr.forEach(item => {
        lowest = item.last < lowest.last ? item : lowest;
      });
      return lowest;
    },

    getSummary(trending) {
      const stocks = Object.keys(trending);
      return stocks.filter(s => !trending[s].bad).map(s => {
        const subject = trending[s];
        const prices = subject.prices;
        const _return = {};

        _return.stock = subject.sym;
        _return.bad = subject.bad;
        _return.startTime = prices.length > 0 ? prices[0].time : null;
        _return.endTime =
          prices.length > 0 ? prices[prices.length - 1].time : null;
        _return.open = prices.length > 0 ? prices[0].open : null;
        _return.close =
          prices.length > 0 ? prices[prices.length - 1].last : null;
        const high = this.getHigh(prices);
        _return.high = high ? high.last : null;
        const low = this.getLow(prices);
        _return.low = low ? low.last : null;
        _return.hotStartPrice = prices.length > 0 ? prices[0].last : null;

        _return.percentChange =
          100 * ((_return.close - _return.open) / _return.open);
        _return.hotColdPercentChange =
          100 * ((_return.close - _return.hotStartPrice) / _return.hotStartPrice);
        _return.hotColdHighPercentChange =
          100 * ((_return.high - _return.hotStartPrice) / _return.hotStartPrice);
        _return.highPercentChange =
          100 * ((_return.high - _return.open) / _return.open);

        return _return;
      }).sort((a, b) => b.hotColdHighPercentChange - a.hotColdHighPercentChange);
    },

    onRowClicked($event) {
      this.selectedStock = $event;
    },

    deleteRecordOfDate() {
      const deletePrompt = prompt("Input the date (yyyy-m-d) of");
      if (deletePrompt && deletePrompt.length > 0) {
        axios.post('/delete-records', { date: deletePrompt }).then(d => {
          if (d.data.deleted === 1) {
            this.alertMessage = 'deleted ' + deletePrompt + ' records';
            setTimeout(() => {
              this.alertMessage = '';
            }, 3000)
          }
        })
      }
    },
    pick($event) {
      this.date = `${$event.getFullYear()}-${$event.getMonth() + 1}-${$event.getDate()}`;
      window.location = `?date=${this.date}`;
    },
    stepBackInTime() {
      // this.end = 
      const d = new Date();
      let splitted = this.end.split(':');
      d.setHours(Number(splitted[0]))
      d.setMinutes(Number(splitted[1]) - 5)
      splitted = d.toLocaleTimeString().split(':');
      this.end = `${splitted[0]}:${splitted[1]}`;
      window.location.search = this.getQueryString();
    },
    stepForwardInTime() {
      // console.log(this.end);
      const d = new Date();
      let splitted = this.end.split(':');
      d.setHours(Number(splitted[0]))
      d.setMinutes(Number(splitted[1]) + 5)
      splitted = d.toLocaleTimeString().split(':');
      this.end = `${splitted[0]}:${splitted[1]}`;
      // console.log(this.end);
      window.location.search = this.getQueryString();
    },
    getQueryString() {
      const queryObj = {
        end: this.end ? this.end : undefined,
        start: this.start ? this.start : undefined,
        date: this.date ? this.date : undefined
      }
      const keys = Object.keys(queryObj);
      if (keys.length === 0) {
        return ''
      }
      let queryString = '?'
      keys.filter(k => queryObj[k]).forEach((k, i) => {
        queryString += `${k}=${queryObj[k]}&`
      })
      return queryString;
    }
  }
});
