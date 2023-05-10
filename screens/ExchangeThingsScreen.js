import React from 'react';
import {StyleSheet, TextInput, KeyboardAvoidingView, TouchableOpacity, Alert, View, Text} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader';

export default class ExchangeThingsScreen extends React.Component {
    constructor() {
        super();
        this.state = {
            userId : firebase.auth().currentUser.email,
            thingName:"",
            reasonToRequest:"",
            requestId: "",
            requestedThingName: "",
            thingStatus: "",
            docId: "",
            userDocId: "",
            IsRequestedItemRequestActive: "",
            countryCurrencyCode: "",
            value: "",
            userCountryCurrencyCode: ""
        }
    }

    addRequest = (thingName, reasonToRequest) => {
        var countryCurrencyCode = this.state.countryCurrencyCode;
        var userId = this.state.userId;
        var value = this.state.value;
        var randomRequestId = this.createUniqueId();

        db.collection('requested_things').add({
            'user_id': userId,
            'thing_name': thingName,
            'reason_to_request': reasonToRequest,
            'request_id': randomRequestId,
            'value': value,
            'country_currency_code': countryCurrencyCode,
            'thing_status': 'requested'
        });

        this.getThingRequest();

        db.collection('users').where('email_id', '==', this.state.userId).get().then().then((snapshot) => {
            snapshot.forEach((doc) => {
                db.collection('users').doc(doc.id).update({
                    IsRequestedItemRequestActive: true
                });
            });
        });

        this.setState({
            reasonToRequest: '',
            thingName: '',
            value: '',
            countryCurrencyCode: ''
        });

        return Alert.alert('Thing requested successfully');
    }

    createUniqueId() {
        var rand = Math.random().toString(36);

        return rand.substring(7);    
    }

    getIsRequestedItemRequestActive = () => {
        db.collection('users').where('email_id', '==', this.state.userId).onSnapshot((snapshot) => {
            snapshot.forEach((doc) => {
                this.setState({
                    IsRequestedItemRequestActive: doc.data().IsRequestedItemRequestActive,
                    userDocId: doc.id
                });
            });
        });
    }

    getThingRequest = () => {
        var thingRequest = db.collection('requested_things').where('user_id', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.data().thing_status !== 'received') {
                    this.setState({
                        requestId: doc.data().request_id,
                        requestedThingName: doc.data().thing_name,
                        thingStatus: doc.data().thing_status,
                        docId: doc.id,
                        itemValue: doc.data().value,
                        userCountryCurrencyCode: doc.data().country_currency_code
                    });
                    
                    console.log(doc.data());
                } 
            });
        });
    }

    sendNotification = () => {
        db.collection('users').where('email_id', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                var name = doc.data().first_name;
                var lastName = doc.data().last_name;
      
                db.collection('all_notifications').where('request_id', '==', this.state.requestId).get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var donorId = doc.data().donor_id;
                        var thingName = doc.data().thing_name;
            
                        db.collection('all_notifications').add({
                            "targeted_user_id": donorId,
                            "message": name + " " + lastName + " " + "received the requested item" + " " + thingName,
                            "notification_status": "unread",
                            "thing_name": thingName 
                        });
                    });
                });
            });
        });
    }

    updateThingRequestStatus = () => {
        db.collection('requested_things').doc(this.state.docId).update({
          "thing_status": "received"
        });
    
        db.collection('users').where("email_id", "==", this.state.userId).get().then((snapshot) => {
          snapshot.forEach((doc) => {
            db.collection('users').doc(doc.id).update({
              "IsRequestedItemRequestActive": false
            });
          });
        });
      }
    
    receivedThings = (thingName) => {
        var userId = this.state.userId;
        var requestId = this.state.requestId;

        db.collection('received_things').add({
            "user_id": userId,
            "thing_name": thingName,
            "request_id": requestId,
            "thing_status": "received"
        });
    }
    
    componentDidMount() {
        this.getThingRequest();
        this.getIsRequestedItemRequestActive();
    }
    
    render() {
        if (this.state.IsRequestedItemRequestActive === true) {
            return (
                <View style={{flex: 1, justifyContent: 'center'}}>
                    <View style={{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10}}>
                        <Text style={{fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline'}}>Requested Thing Name</Text>
                        <Text>{this.state.requestedThingName}</Text>
                    </View>

                    <View style={{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10}}>
                        <Text style={{fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline'}}>Requested item status</Text>
                        <Text>{this.state.thingStatus}</Text>
                    </View>

                    <View style={{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10}}>
                        <Text style={{fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline'}}>Requested item value</Text>
                        <Text>{this.state.itemValue}</Text>
                    </View>

                    <View style={{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10}}>
                        <Text style={{fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline'}}>Country currency code</Text>
                        <Text>{this.state.userCountryCurrencyCode}</Text>
                    </View>

                    <TouchableOpacity 
                        style={{borderWidth: 1, borderColor: '#000', backgroundColor: '#ff9800', width: 300, alignItems: 'center', alignSelf: 'center', height: 30, marginTop: 30}}
                        onPress={() => {
                            this.sendNotification();
                            this.updateThingRequestStatus();
                            this.receivedThings(this.state.requestedThingName);
                        }}
                    >
                        <Text>I received the requested item</Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            return (
                <View style={{flex: 1}}>
                    <MyHeader navigation={this.props.navigation} title="Request Things" />
    
                    <KeyboardAvoidingView style={styles.keyBoardStyle} behavior="padding" enabled>
                        <TextInput 
                            placeholder="Enter thing name" 
                            style={styles.formTextInput}
                            multiline
                            onChangeText={e => {this.setState({thingName: e})}}
                            value={this.state.thingName}
                        />
    
                        <TextInput 
                            placeholder="Enter Reason to Request" 
                            style={styles.formTextInput}
                            multiline 
                            numberOfLines={8}
                            onChangeText={e => {this.setState({reasonToRequest: e})}}
                            value={this.state.reasonToRequest}
                        />

                        <TextInput 
                            placeholder="Enter the value of the item"
                            style={styles.formTextInput}
                            keyboardType="numeric"
                            onChangeText={e => {this.setState({value: e})}}
                            value={this.state.value}
                        />

                        <TextInput 
                            placeholder="Enter the country currency code"
                            style={styles.formTextInput}
                            keyboardType="default"
                            onChangeText={e => {this.setState({countryCurrencyCode: e})}}
                            value={this.state.countryCurrencyCode}
                        />
    
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={() => {
                                this.addRequest(this.state.thingName, this.state.reasonToRequest)
                            }}
                        >
                            <Text>Request Thing</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            );
        }
    }
}

const styles = StyleSheet.create({
    formTextInput: {
        width: '75%',
        height: 35,
        alignSelf: 'center',
        borderColor: '#ffab91',
        borderRadius: 10,
        borderWidth: 1,
        marginTop: 20,
        padding: 20
    },
    button: {
        width: '75%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#ff5722',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
        elevation: 16,
        marginTop: 20
    },
    keyBoardStyle : {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },
});