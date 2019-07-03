  resetFeeds: () => {
    this.setState({
      feeds: []
    });
  },

  getUpdatedFeedback: doc => {
    db.collection(fbFeeds)
      .doc(doc)
      .get()
      .then(updatedDoc => {
        this.state.feeds.findIndex(doc);
        this.setState({
          feeds: this.state.feeds
        });
      });
  },

  realTimeFeedListener: () => {
    db.collection(fbFeeds)
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {
        // console.log(snapshot);
        // This is done to update state on first page load
        if (this.state.feeds.length === 0) {
          snapshot.docs.forEach(feed => {
            const firstFeedLoad = feed.data();
            firstFeedLoad.id = feed.id;
            this.setState({
              feeds: [...this.state.feeds, firstFeedLoad]
            });
          });
          return;
        }

        // After first page load app listens to changes
        // and updates state
        const changes = snapshot.docChanges();
        console.log("real-time changes", changes);
        changes.forEach(change => {
          // console.log("modified", change.doc);
          const data = change.doc.data();
          data.id = change.doc.id;
          if (change.type === "modified") {
            let modifiedFeedList = this.state.feeds;
            const modifiedFeedIndex = modifiedFeedList.findIndex(
              feed => feed.id === change.doc.id
            );
            modifiedFeedList[modifiedFeedIndex] = data;
            this.setState({
              feeds: modifiedFeedList
            });
          } else if (change.type === "added") {
            this.setState({
              feeds: [data, ...this.state.feeds]
            });
          } else if (change.type === "removed") {
            const removeFeed = this.state.feeds.filter(feed => {
              return feed.id !== change.doc.id;
            });
            this.setState({
              feeds: removeFeed
            });
          }
        });
      });
  },

  getFeeds: () => {
    this.setState({ refreshing: true });

    db.collection(fbFeeds)
      .orderBy("timestamp", "desc")
      .get()
      .then(feed => {
        this.setState({
          feeds: []
        });
        feed.forEach(elem => {
          const data = elem.data();
          data.id = elem.id;
          this.setState({
            feeds: [...this.state.feeds, data],
            refreshing: false
          });
        });
      });
  },

  getHashtagList: () => {
    db.collection(fbHashtags)
      .get()
      .then(async hashtags => {
        this.setState({ hashtags: [] });
        const hashList = await hashtags.docs.map(hash => {
          const hashData = hash.data();
          delete hashData.count;
          return { id: hash.id, moods: hashData, count: hash.data().count };
        });
        const sortedHashList = _.orderBy(hashList, ["count"], ["desc"]);
        sortedHashList.forEach(hash => {
          this.setState({ hashtags: [...this.state.hashtags, hash] });
        });
      });
  },

  addFeedback: data => {
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
        // this.getFeeds();
        this.getHashtagList();
        setTimeout(() => this.setState({ alert: null }), 2000);
      })
      .catch(err => {
        console.log("error", " => ", err);
      });
  },

  deleteFeedback: id => {
    db.collection(fbFeeds)
      .doc(id)
      .delete()
      .then(() => {
        // console.log("Document successfully deleted!");
        // this.getFeeds();
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
  },

  addComment: (id, comment) => {
    console.log(id);
    db.collection(fbFeeds)
      .doc(id)
      .update({
        comments: firebase.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          comment
        })
      })
      .then(res => {
        console.log(res);
        // this.getFeeds();
      });
  },

  addReaction: (id, reaction) => {
    console.log("id", id, "reaction", reaction);
    const updatedField = `reactions.${reaction}`;
    db.collection(fbFeeds)
      .doc(id)
      .update({
        [updatedField]: firebase.firestore.FieldValue.increment(1)
      })
      .then(res => console.log(res))
      .catch(err => console.log(err));
  }