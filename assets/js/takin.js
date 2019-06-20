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

new Vue({
  el: '#app',
  data() {
    return {
      totalEvent: 0,
      totalUser: 0,
      notifSuccess: false,
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
    }
  },
  computed: {},
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
      this.newEvent.location_lat = loc.geometry.location.lat;
      this.newEvent.location_long = loc.geometry.location.lng;
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
  }
});