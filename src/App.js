import React, { Component } from "react";

// REACT ROUTER
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

// CONTAINERS IMPORTS
import FeedPage from "./containers/FeedPage";
import AddFeedback from "./containers/AddFeedback";
import Results from "./containers/Results";
import Navbar from "./containers/Navbar";
import Profile from "./containers/Profile";
import Alert from "./components/Alerts";
import _ from "lodash";

// CSS IMPORTS
import "./styles/App.css";
import "./styles/Card.css";
import "./styles/FeedPage.css";
import "./styles/FeedCard.css";
import "./styles/SearchBar.css";
import "./styles/Results.css";
import "./styles/Navbar.css";
import "./styles/Deck.css";
import "./styles/WelcomePage.css";
import "./styles/SwipeHints.css";
import "./styles/AddCommentModal.css";
import "./styles/EmotionMap.css";
import "./styles/Profile.css";
import "./styles/LazyLoadButton.css";
import "./styles/Loader.css";

// REDUX
import { connect } from "react-redux";

// FIREBASE
import firebase from "firebase";
import { fb } from "./config";
import {
  onAuthStateChanged,
  realTimeFeedListener,
  getHashtagList
} from "./actions/firebaseActions";
const fbFeeds = "publicEmocio";
const fbHashtags = "publicHashtags";
// const fbFeeds = "feedback";
// const fbHashtags = "hashtags";
// const fbFeeds = "iotWorkshop";
// const fbHashtags = "iotHashtags";
const db = fb.firestore();

class App extends Component {
  state = {
    currentTab: "AddFeedback",
    feeds: [],
    hashtags: [],
    alert: null
  };

  getUpdatedFeedback = doc => {
    db.collection(fbFeeds)
      .doc(doc)
      .get()
      .then(updatedDoc => {
        this.state.feeds.findIndex(doc);
        this.setState({
          feeds: this.state.feeds
        });
      });
  };

  addFeedback = data => {
    data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
    // first: get the Refs for the Hashtag list & the new feedback entry
    const hashtagListRef = db.collection(fbHashtags);
    const newFeedbackRef = db.collection(fbFeeds);
    // get whole hashtag obj from firebase
    const updateHashtagList = data.hashtags.map(async hash => {
      const hashtagDocRef = hashtagListRef.doc(hash);
      const hashtagExists = await hashtagDocRef.get().then(res => res.exists);

      if (hashtagExists) {
        hashtagDocRef.update({
          count: firebase.firestore.FieldValue.increment(1),
          [data.mood]: firebase.firestore.FieldValue.increment(1)
        });
        return;
      } else {
        hashtagDocRef.set({
          count: 1,
          [data.mood]: 1
        });
        return;
      }
    });
    // third: create new feedback entry
    const createFeedback = newFeedbackRef.add(data);
    // resolve all promises
    Promise.all([createFeedback, ...updateHashtagList])
      .then(res => {
        // console.log(res);
        this.setState({
          alert: {
            variant: "success",
            msg: "Thank you for your Feedback!!",
            id: res[0].id,
            hashtags: data.hashtags
          }
        });

        this.props.getHashtagList();
        setTimeout(() => this.setState({ alert: null }), 2000);
      })
      .catch(err => {
        console.log("error", " => ", err);
      });
  };

  deleteFeedback = id => {
    db.collection(fbFeeds)
      .doc(id)
      .delete()
      .then(() => {
        // console.log("Document successfully deleted!");

        this.getHashtagList();
      })
      .catch(function(error) {
        // console.error("Error removing document: ", error);
      });
    // const updateHashtagList = data.hashtags.map(hash => {
    //   return hashtagListRef.update({
    //     [hash]: firebase.firestore.FieldValue.decrement(1)
    //   });
    // });
  };

  addComment = (id, comment, author) => {
    console.log(id);
    db.collection(fbFeeds)
      .doc(id)
      .update({
        comments: firebase.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          comment,
          author
        })
      })
      .then(res => {
        // console.log(res);
      });
  };

  addReaction = (id, reaction) => {
    console.log("id", id, "reaction", reaction);
    const updatedField = `reactions.${reaction}`;
    db.collection(fbFeeds)
      .doc(id)
      .update({
        [updatedField]: firebase.firestore.FieldValue.increment(1)
      })
      .then(res => console.log(res))
      .catch(err => console.log(err));
  };

  componentDidMount = async () => {
    this.props.onAuthStateChanged();
    this.props.realTimeFeedListener();
    this.props.getHashtagList();
  };

  render() {
    const { currentTab, feeds, hashtags, alert } = this.state;
    // console.log("feeds", feeds);
    const feedPage = (
      <FeedPage
        // feeds={feeds}
        refreshing={this.state.refreshing}
        addComment={this.addComment}
        addReaction={this.addReaction}
      />
    );
    const addFeedback = (
      <AddFeedback
        hashtags={hashtags}
        addFeedback={this.addFeedback}
        deleteFeedback={this.deleteFeedback}
      />
    );
    const results = <Results feeds={feeds} hashtags={hashtags} />;
    const profile = <Profile />;

    return (
      <Router>
        <div>
          {alert !== null ? (
            <Alert data={alert} deleteFeedback={this.deleteFeedback} />
          ) : (
            ""
          )}
          <Navbar />
          <Switch>
            <Route path="/add-feed" exact render={props => addFeedback} />
            <Route path="/feed-page" render={props => feedPage} />
            <Route path="/analytics" render={props => results} />
            <Route path="/profile" render={props => profile} />
            <Route render={props => addFeedback} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default connect(
  null,
  { onAuthStateChanged, realTimeFeedListener, getHashtagList }
)(App);
