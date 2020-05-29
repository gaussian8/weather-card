const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;

const weatherIconsDay = {
  clear: "day",
  "clear-night": "night",
  cloudy: "cloudy",
  fog: "cloudy",
  hail: "rainy-7",
  lightning: "thunder",
  "lightning-rainy": "thunder",
  partlycloudy: "cloudy-day-3",
  pouring: "rainy-6",
  rainy: "rainy-5",
  snowy: "snowy-6",
  "snowy-rainy": "rainy-7",
  sunny: "day",
  windy: "cloudy",
  "windy-variant": "cloudy-day-3",
  exceptional: "!!",
};

const weatherIconsNight = {
  ...weatherIconsDay,
  clear: "night",
  sunny: "night",
  partlycloudy: "cloudy-night-3",
  "windy-variant": "cloudy-night-3",
};

const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

function hasConfigOrEntityChanged(element, changedProps) {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldHass = changedProps.get("hass");
  if (oldHass) {
    return (
      oldHass.states[element._config.entity] !==
        element.hass.states[element._config.entity] ||
      oldHass.states["sun.sun"] !== element.hass.states["sun.sun"]
    );
  }

  return true;
}

function returnLargerValue(val1, val2) {
  return val1 > val2 ? val1 : val2;
}

class WeatherCard extends LitElement {
  static get properties() {
    return {
      _config: {},
      hass: {},
    };
  }

  static async getConfigElement() {
    await import("./weather-card-editor.js");
    return document.createElement("weather-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a weather entity");
    }
    this._config = config;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    var stateObj = this.hass.states[this._config.entity];

    for (var i = 0; i <= 3; i++) {
      let rain_rate_am = this.hass.states["weather.naverweather"].attributes
        .forecast[i].rain_rate_am;
      let rain_rate_pm = this.hass.states["weather.naverweather"].attributes
        .forecast[i].rain_rate_pm;

      stateObj.attributes.forecast[i].precip_prob = returnLargerValue(
        rain_rate_am,
        rain_rate_pm
      );
    }
    const temp_min = Math.round(
      this.hass.states["sensor.naver_weather"].attributes.최저온도.split(
        "°C"
      )[0]
    );
    const temp_max = Math.round(
      this.hass.states["sensor.naver_weather"].attributes.최고온도.split(
        "°C"
      )[0]
    );
    const apparent_temp = Math.round(
      this.hass.states["sensor.naver_weather"].attributes.체감온도.split(
        "°C"
      )[0]
    );

    const Grade_No = { 좋음: 1, 보통: 2, 나쁨: 3, "매우 나쁨": 4, 알수없음: 0 };

    const pm10_value = Math.round(
      this.hass.states["sensor.airkorea_pm10"].state
    );
    const pm25_value = Math.round(
      this.hass.states["sensor.airkorea_pm25"].state
    );
    const pm10_grade = this.hass.states["sensor.airkorea_pm10_grade_1h"].state;
    const pm25_grade = this.hass.states["sensor.airkorea_pm25_grade_1h"].state;
    const pm10_grade_no =
      Grade_No[this.hass.states["sensor.airkorea_pm10_grade_1h"].state];
    const pm25_grade_no =
      Grade_No[this.hass.states["sensor.airkorea_pm25_grade_1h"].state];

    if (!stateObj) {
      return html`
        <style>
          .not-found {
            flex: 1;
            background-color: yellow;
            padding: 8px;
          }
        </style>
        <ha-card>
          <div class="not-found">
            Entity not available: ${this._config.entity}
          </div>
        </ha-card>
      `;
    }

    const lang = this.hass.selectedLanguage || this.hass.language;

    const next_rising = new Date(
      this.hass.states["sun.sun"].attributes.next_rising
    );
    const next_setting = new Date(
      this.hass.states["sun.sun"].attributes.next_setting
    );

    return html`
      ${this.renderStyle()}
      <ha-card @click="${this._handleClick}">
        <div class="main_info">
          <span
            class="icon bigger"
            style="background: none, url(${this.getWeatherIcon(
              stateObj.state.toLowerCase(),
              this.hass.states["sun.sun"].state
            )}) no-repeat; background-size: 100%; background-position: center;"
            >${stateObj.state}
          </span>
          <span class="temp"
            >${this.getUnit("temperature") == "°F"
              ? Math.round(stateObj.attributes.temperature)
              : stateObj.attributes.temperature}</span
          >
          <span class="tempc"> ${this.getUnit("temperature")}</span>
        </div>
        <div class="sub_info">
          ${temp_max}°/${temp_min}° &nbsp; 체감온도 ${apparent_temp}°
        </div>
        <ul class="variations">
          <li>
            <table>
              <tr>
                <td>
                  <span class="ha-icon"
                    ><ha-icon icon="mdi:blur-linear"></ha-icon
                  ></span>
                </td>
                <td>
                  <div class="dust_title">미세먼지</div>
                  <div class="dust_cont">
                    ${pm10_grade}<span class="dust dust_${pm10_grade_no}"
                      >${pm10_value}</span
                    >
                  </div>
                </td>
              </tr>
            </table>
          </li>
          <li>
            <table>
              <tr>
                <td>
                  <span class="ha-icon"
                    ><ha-icon icon="mdi:blur"></ha-icon
                  ></span>
                </td>
                <td>
                  <div class="dust_title">초미세먼지</div>
                  <div class="dust_cont">
                    ${pm25_grade}<span class="dust dust_${pm25_grade_no}"
                      >${pm25_value}</span
                    >
                  </div>
                </td>
              </tr>
            </table>
          </li>
        </ul>

        ${stateObj.attributes.forecast &&
        stateObj.attributes.forecast.length > 0
          ? html`
              <div class="forecast clear">
                ${stateObj.attributes.forecast.slice(0, 4).map(
                  (daily) => html`
                    <div class="day">
                      <span class="dayname"
                        >${new Date(daily.datetime).toLocaleDateString(lang, {
                          weekday: "short",
                        })}</span
                      >
                      <br /><i
                        class="icon"
                        style="background: none, url(${this.getWeatherIcon(
                          daily.condition.toLowerCase()
                        )}) no-repeat; background-size: contain;"
                      ></i>
                      <br /><span class="highTemp"
                        >${Math.round(daily.temperature)}${this.getUnit(
                          "temperature"
                        )}</span
                      >
                      ${typeof daily.templow !== "undefined"
                        ? html`
                            /
                            <span class="lowTemp"
                              >${Math.round(daily.templow)}${this.getUnit(
                                "temperature"
                              )}</span
                            >
                          `
                        : ""}
                      ${typeof daily.precip_prob !== "undefined"
                        ? html`
                            <div class="precip_prob">
                              <svg
                                style="width:13px;height:13px"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="#999999"
                                  d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z"
                                /></svg
                              >${Math.round(daily.precip_prob)}%
                            </div>
                          `
                        : ""}
                    </div>
                  `
                )}
              </div>
            `
          : ""}
      </ha-card>
    `;
  }

  getWeatherIcon(condition, sun) {
    return `${
      this._config.icons
        ? this._config.icons
        : // : "https://cdn.jsdelivr.net/gh/bramkragten/custom-ui@master/weather-card/icons/animated/"
          "/local/custom_ui/weather-card/icons/animated/"
    }${
      sun && sun == "below_horizon"
        ? weatherIconsNight[condition]
        : weatherIconsDay[condition]
    }.svg`;
  }

  getUnit(measure) {
    const lengthUnit = this.hass.config.unit_system.length;
    switch (measure) {
      case "air_pressure":
        return lengthUnit === "km" ? "hPa" : "inHg";
      case "length":
        return lengthUnit;
      case "precipitation":
        return lengthUnit === "km" ? "mm" : "in";
      default:
        return this.hass.config.unit_system[measure] || "";
    }
  }

  _handleClick() {
    fireEvent(this, "hass-more-info", { entityId: this._config.entity });
  }

  getCardSize() {
    return 1;
  }

  renderStyle() {
    return html`
      <style>
        ha-card {
          margin: auto;
          padding-top: 29px;
          padding-bottom: 30px;
          padding-left: 1em;
          padding-right: 1em;
          position: relative;
        }

        .clear {
          clear: both;
        }

        .ha-icon {
          height: 18px;
          margin-right: 5px;
          color: var(--paper-item-icon-color);
        }

        .title {
          position: absolute;
          left: 3em;
          top: 0.6em;
          font-weight: 300;
          font-size: 3em;
          color: var(--primary-text-color);
        }
        .temp {
          font-weight: 500;
          font-size: 4em;
          color: var(--primary-text-color);
          position: relative;
          right: 10px;
          top: 0;
        }

        .tempc {
          font-weight: 500;
          font-size: 1.5em;
          vertical-align: super;
          color: var(--primary-text-color);
          position: relative;
          right: 10px;
          top: -20px;
        }

        .variations {
          font-weight: 300;
          color: var(--primary-text-color);
          list-style: none;
          padding: 10px 0;
          margin: 20px 0;
          border: 1px solid #eee;
          border-radius: 10px;
          width: 100%;
        }

        .variations li {
          width: 50%;
          display: block;
          text-align: center;
          margin: 0;
          padding: 0;
          float: left;
          box-sizing: border-box;
        }
        .variations li:first-child {
          border-right: 1px dashed #ddd;
        }

        .variations li table {
          margin: auto;
        }
        .variations li table td {
          text-align: left;
        }

        .variations:after {
          content: "";
          display: block;
          clear: both;
        }

        .variations .dust_title {
          font-size: 11px;
          color: #666;
          margin-bottom: 2px;
        }
        .variations .dust_cont {
          font-size: 13px;
          color: #222;
        }
        .variations .dust {
          font-size: 11px;
          font-weight: 500;
          color: #fff;
          border-radius: 3px;
          padding: 1px 5px;
          margin-left: 5px;
        }
        .variations .dust_1 {
          background-color: #0e5d94;
        }
        .variations .dust_2 {
          background-color: #0cbb4a;
        }
        .variations .dust_3 {
          background-color: #e0a132;
        }
        .variations .dust_4 {
          background-color: #e03232;
        }

        .unit {
          font-size: 0.8em;
        }

        .forecast {
          width: 100%;
          margin: 0 auto;
          height: 9em;
        }

        .day {
          display: block;
          width: 25%;
          float: left;
          text-align: center;
          color: var(--primary-text-color);
          border-right: 0.1em solid #d9d9d9;
          line-height: 2;
          box-sizing: border-box;
          font-size: 12px;
        }

        .dayname {
          text-transform: uppercase;
        }

        .forecast .day:first-child {
          margin-left: 0;
        }

        .forecast .day:nth-last-child(1) {
          border-right: none;
          margin-right: 0;
        }

        .highTemp {
          font-weight: bold;
        }

        .lowTemp {
          color: var(--secondary-text-color);
        }

        .precip_prob svg {
          position: relative;
          top: 2px;
        }
        .main_info {
          width: 100%;
          height: 70px;
          line-height: 70px;
          text-align: center;
        }
        .sub_info {
          width: 100%;
          text-align: center;
          font-size: 16px;

          color: #999;
        }
        .icon.bigger {
          width: 125px;
          height: 125px;

          margin-top: -30px;
          margin-right: 0;
          right: 15px;
          position: relative;
          left: 0em;
        }

        .icon {
          width: 50px;
          height: 50px;
          margin-right: 5px;
          display: inline-block;
          vertical-align: middle;
          background-size: contain;
          background-position: center center;
          background-repeat: no-repeat;
          text-indent: -9999px;
        }

        .weather {
          font-weight: 300;
          font-size: 1.5em;
          color: var(--primary-text-color);
          text-align: left;
          position: absolute;
          top: -0.5em;
          left: 6em;
          word-wrap: break-word;
          width: 30%;
        }
      </style>
    `;
  }
}
customElements.define("weather-card", WeatherCard);
