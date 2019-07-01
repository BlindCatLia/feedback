import React, { Component } from "react";
import AddComment from "../components/AddCommentModal";
import Header from "../components/Header";
import Deck from "../components/Deck";
import SwipeHints from "../components/SwipeHints";
import moods from "../data.js";
import _ from "lodash";
import { geolocated } from "react-geolocated";
import firebase from "firebase";

const data = _.shuffle(moods);

class AddFeedback extends Component {
  state = {
    showAddFeedback: false,
    currentMood: 0,
    // email: "",
    comment: "",
    // mood: data[this.state.currentMood].name,
    title: "",
    hashtags: []
  };

  handleHashtags = list => {
    console.log("state", " => ", this.state);
    const validatedList = [];
    for (let hash of list) {
      hash = hash.replace(/[^A-Z0-9]+/i, "");
      if (hash[0] !== "#") {
        var splittedHash = hash.split("");
        splittedHash.unshift("#");
        var validatedHash = splittedHash.join("");
      }
      validatedList.push(validatedHash);
    }
    this.setState({
      hashtags: validatedList
    });
  };

  handleInput = (e, input) => {
    this.setState({ [e.target.name]: e.target.value });
    console.log(this.state);
  };

  toggleShowAddFeedback = i => {
    this.setState({
      showAddFeedback: this.state.showAddFeedback ? false : true,
      currentMood: i
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.addFeedback({
      comment: this.state.comment,
      mood: data[this.state.currentMood].name,
      title: this.state.title,
      hashtags: this.state.hashtags
    });
    this.setState({
      showAddFeedback: false,
      comment: "",
      title: "",
      hashtags: [],
      location: this.props.coords
        ? new firebase.firestore.GeoPoint(
            this.props.coords.latitude,
            this.props.coords.longitude
          )
        : false
    });
  };

  render() {
    !this.props.isGeolocationAvailable
      ? console.log("Your browser does not support Geolocation")
      : !this.props.isGeolocationEnabled
      ? console.log("Geolocation is not enabled")
      : this.props.coords
      ? console.log(this.props.coords.latitude, this.props.coords.longitude)
      : console.log("Getting the location data");

    return (
      <div className="add-feedback-cards">
        <Header header="Add Feedback" />
        <SwipeHints />
        <Deck toggleShowAddFeedback={this.toggleShowAddFeedback} data={data} />
        <AddComment
          data={data}
          hashtags={this.props.hashtags}
          toggleShowAddFeedback={this.toggleShowAddFeedback}
          handleHashtags={this.handleHashtags}
          handleInput={this.handleInput}
          handleSubmit={this.handleSubmit}
          state={this.state}
        />
      </div>
    );
  }
}

export default geolocated({
  positionOptions: {
    enableHighAccuracy: true
  },
  userDecisionTimeout: 5000
})(AddFeedback);
