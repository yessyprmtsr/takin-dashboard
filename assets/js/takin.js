const firebaseConfig = {
  apiKey: "AIzaSyA8FYNFaCr-Vlql9sTZe4hOKYDtFEiGRZo",
  authDomain: "takin-app.firebaseapp.com",
  databaseURL: "https://takin-app.firebaseio.com",
  projectId: "takin-app",
  storageBucket: "takin-app.appspot.com",
  messagingSenderId: "255259217202",
  appId: "1:255259217202:web:4b89db1e788dd502"
};
firebase.initializeApp(firebaseConfig);

//firebase storage
const storageService = firebase.storage();
const storageRef = storageService.ref();
//firebase db
const db = firebase.firestore();

//use vuelidate
Vue.use(window.vuelidate.default)
const { required } = window.validators

new Vue({
  el: '#app',
  data() {
    return {
      totalEvent: 0,
      totalUser: 0,
      notifSuccess: false,
      sectionActive: '',
      isUsingImageURL: true,
      selectedFile: '',
      isSubmitLoading: false,
      isLocationLoading: false,
      locationResult: [],
      newEvent: {
        title: '',
        description: '',
        publisher: '',
        date: '',
        time_start: '',
        time_end: '',
        location_name: '',
        location_address: '',
        location_lat: '',
        location_long: '',
        type: '',
        point: '0',
        price: '0',
        ticket_total: '0',
        ticket_sold: '0',
        photo_url: '',
      },
      //eventListData
      isLoadingEventList: true,
      allEvent: [],
    }
  },
  validations: {
    newEvent: {
      title: {
        required,
      },
      description: {
        required,
      },
      publisher: {
        required,
      },
      location_name: {
        required,
      },
      type: {
        required,
      },
    }
  },
  mounted() {
    this.getUserCount();
    this.getEventCount();
  },
  methods: {
    getUserCount() {
      const self = this;
      db.collection('user').get().then(snap => {
        self.totalUser = snap.size;
     });
    },

    dismissNotif() {
      this.notifSuccess = false;
    },

    changeMenu(menu) {
      window.scroll(0, 0);
      this.sectionActive = menu;

      if(menu === 'eventList') {
        this.getAllEventData();
      }
    },

    imageChoice(param) {
      this.isUsingImageURL = param;
    },

    getEventCount() {
      const self = this;
      db.collection('event').get().then(snap => {
        self.totalEvent = snap.size;
     });
    },

    searchPlace(e) {
      this.isLocationLoading = true;
      const self = this;
      axios.get(`https://multazamgsd.com/maps/?q=${encodeURI(e.target.value)}`)
      .then((result) => {
        self.locationResult = result.data.candidates;
        self.isLocationLoading = false;
      }).catch(err => console.log(err));
    },

    setLocation(loc) {
      this.newEvent.location_name = loc.name;
      this.newEvent.location_address = loc.formatted_address;
      this.newEvent.location_lat = String(loc.geometry.location.lat);
      this.newEvent.location_long = String(loc.geometry.location.lng);
    },

    unsetLocation() {
      this.newEvent.location_name = '';
      this.newEvent.location_address = '';
      this.newEvent.location_lat = '';
      this.newEvent.location_long = '';
    },

    fileChange(e) {
      this.selectedFile = e.target.files[0];
    },

    submitEvent() {
      if (this.$v.$invalid) { return; } //if form is not valid, then do nothing

      this.isSubmitLoading = true;
      const self = this;

      if(!this.isUsingImageURL) {
        this.uploadImage().then((uploadImageResult) =>{
          console.log(uploadImageResult);
          self.newEvent.photo_url = uploadImageResult;

          this.saveDataToDatabase().then((saveDataToDatabaseResult) => {
            this.successSaveData();
          }).catch((saveDataToDatabaseError) => {
            console.log('save data to database error: ', saveDataToDatabaseError);
          });
        }).catch((uploadImageError) => {
          console.log('upload image error: ', uploadImageError);
        });
      } else {
        this.saveDataToDatabase().then((saveDataToDatabaseResult) => {
          this.successSaveData();
        }).catch((saveDataToDatabaseError) => {
          console.log('save data to database error: ', saveDataToDatabaseError);
        });
      }
    },

    uploadImage() {
      const self = this;
      return new Promise((resolve, reject) => {
        const uploadTask = storageRef.child(`takin-event-image/${self.selectedFile.name}`).put(self.selectedFile);
        uploadTask.then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => resolve(url))
        .catch((error) => {
          reject(error);
        })
      });
    },

    saveDataToDatabase() {
      const self = this;

      return new Promise((resolve, reject) => {
        db.collection("event").add(self.newEvent)
        .then(function(docRef) {
          resolve(docRef);
        })
        .catch(function(error) {
          reject(error);
        });
      });
    },

    successSaveData() {
      const emptyNewEvent = {
        title: '',
        description: '',
        publisher: '',
        date: '',
        time_start: '',
        time_end: '',
        location_name: '',
        location_address: '',
        location_lat: '',
        location_long: '',
        type: '',
        point: '0',
        price: '0',
        ticket_total: '0',
        ticket_sold: '0',
        photo_url: '',
      };
      this.newEvent = emptyNewEvent;
      this.getEventCount();
      window.scroll(0, 0);
      this.notifSuccess = true;
      this.isSubmitLoading = false;
      this.locationResult = [];
    },

    getAllEventData() {
      this.isLoadingEventList = true;
      this.allEvent = [];
      const self = this;
      db.collection("event").get().then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const eventItem = {
              docId: doc.id,
              title: doc.data().title,
              publisher: doc.data().publisher,
              location_name: doc.data().location_name,
              ticket_sold: doc.data().ticket_sold,
              ticket_total: doc.data().ticket_total,
            };
            self.allEvent.push(eventItem);
          });
          self.isLoadingEventList = false;
      }).catch(function(error) {
          console.log("Error getting documents: ", error);
      });
    },

    deleteData(docId) {
      const self = this;

      db.collection("event").doc(docId).delete().then(function() {
        self.getEventCount();
        self.getAllEventData();
        window.scroll(0, 0);
        self.notifSuccess = true;
      }).catch(function(error) {
        console.error("Error removing document: ", error);
      });    
    },
  }
});