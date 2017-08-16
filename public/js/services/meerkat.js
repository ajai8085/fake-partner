// Factory to share data between controllers
angular
  .module('FakePartnerApp')
  .factory('Meerkat', [ '$http', '$modal', 'flash', MeerkatService ]);

function MeerkatService($http, $modal, flash) {

    var Meerkat = {
        data: {
            locations: [],
            pendingTransactions: [],
            products: [],
            surcounts: [],
            members: [],
            reserves: [],
            posOrders: [],
            myTransactions: [],
            acceptRewardsRedemptions: false,
            acceptPointsRedemptions: false,
            manuallyAccepted: false,
            completeTransactions: true,
            dropAllTransactions: false,
            organisationId: ""
        }
  };

  
    Meerkat.processTransactionWaiting = function(id, orderId, status) {
        if (status == 'waiting') {
            console.log("id = " + id)
            console.log("orderId = " + orderId)
            console.log("status = " + status)
            //get transaction from doshii
            var transReq = {
                method: 'GET',
                url: '/transactions/' + id,
                headers: {
                    'doshii-organisation-id': Meerkat.organisationId
                }
            };
            
            return $http(transReq)
                .then(res => {
                    var response = angular.copy(res.data);
                    delete response.orderId;
                    delete response.log;
                    delete response.acceptLess;
                    delete response.partnerInitiated;
                    delete response.uri;
                    delete response.updatedAt;
                    delete response.createdAt;
                    var theId = response.id;
                    delete response.id;
                    if (!Meerkat.data.dropAllTransactions){
                        if (Meerkat.data.completeTransactions){
                            response.status = 'complete'
                            console.log(response);
                            flash.success = 'transaction received';
                            var req = {
                                method: 'PUT',
                                url: '/transactions/' + theId,
                                headers: {
                                    'doshii-organisation-id': Meerkat.organisationId
                                },
                                data: JSON.stringify(response)
                            };

                            return $http(req)
                                .then(res => {
                                    var response = angular.copy(res.data);
                                    console.log(response);
                                    flash.success = 'transaction completed';
                                    return;
                                })
                        }else{
                            var response = angular.copy(res.data);
                            if (Meerkat.completeTransactions){
                                response.status = 'cancelled'
                                console.log(response);
                                flash.success = 'transaction received';
                                var req = {
                                    method: 'PUT',
                                    url: '/transactions/' + theId,
                                    headers: {
                                        'doshii-organisation-id': Meerkat.organisationId
                                    },
                                    data: JSON.stringify(response)
                                };

                                return $http(req)
                                    .then(res => {
                                        var response = angular.copy(res.data);
                                        console.log(response);
                                        flash.success = 'transaction cancelled';
                                        return;
                                    })
                            }
                        }
                    }
                }).catch(err => {
                    flash.error = 'transaction receive failed: ' + err.statusText + getErrorMessage(err.data);
                    throw err;
                });
        } 
    };

    Meerkat.processRewardsRedemption = function(memberId, rewardId) {
        if (Meerkat.data.acceptRewardsRedemptions) {
            var req = {
                method: 'PUT',
                url: '/members/' + memberId + '/rewards/' + rewardId + '/accept',
                headers: {
                    'doshii-organisation-id': Meerkat.organisationId
                }
            };

            return $http(req)
                .then(res => {
                    var response = angular.copy(res.data);
                    console.log(response);
                    flash.success = 'Reward Accepted';
                    return;
                })
                .catch(err => {
                    flash.error = 'Reward Accept Failed: ' + err.statusText + getErrorMessage(err.data);
                    throw err;
                });
        } else {
            var req = {
                method: 'PUT',
                url: '/members/' + memberId + '/rewards/' + rewardId + '/reject',
                headers: {
                    'doshii-organisation-id': Meerkat.organisationId
                }
            };

            return $http(req)
                .then(res => {
                    var response = angular.copy(res.data);
                    console.log(response);
                    flash.success = 'Reward Rejected';
                    return;
                })
                .catch(err => {
                    flash.error = 'Reward Redect Failed: ' + err.statusText + getErrorMessage(err.data);
                    throw err;
                });
        }
    };

    Meerkat.processPointsRedemption = function(memberId) {
        if (Meerkat.data.acceptPointsRedemptions) {
            var req = {
                method: 'PUT',
                url: '/members/' + memberId + '/points/accept',
                headers: {
                    'doshii-organisation-id': Meerkat.organisationId
                }
            };

            return $http(req)
                .then(res => {
                    var response = angular.copy(res.data);
                    console.log(response);
                    flash.success = 'Points Accepted';
                    return;
                })
                .catch(err => {
                    flash.error = 'Points Accept Failed: ' + err.statusText + getErrorMessage(err.data);
                    throw err;
                });
        } else {
            var req = {
                method: 'PUT',
                url: '/members/' + memberId + '/points/reject',
                headers: {
                    'doshii-organisation-id': Meerkat.organisationId
                }
            };

            return $http(req)
                .then(res => {
                    var response = angular.copy(res.data);
                    console.log(response);
                    flash.success = 'Points rejected';
                    return;
                })
                .catch(err => {
                    flash.error = 'Points reject Failed: ' + err.statusText + getErrorMessage(err.data);
                    throw err;
                });
        }
    };

  Meerkat.getLocations = function() {
    return $http.get('/locations')
      .then(res => {
        Meerkat.data.locations.length = 0;

        Array.prototype.push.apply(Meerkat.data.locations, res.data);
        flash.success = 'Updated Locations';

        return Meerkat.data.locations;
      })
      .catch(err => flash.error = 'Getting locations failed');
  };

Meerkat.getMenu = function (locationId) {
    return $http.get('/locations/' + locationId + '/menu')
      .then(res => {
        Meerkat.data.products.length = 0;
        Meerkat.data.surcounts.length = 0;
        
        Array.prototype.push.apply(Meerkat.data.products, res.data.products);
        Array.prototype.push.apply(Meerkat.data.surcounts, res.data.surcounts);
        flash.success = 'Updated Menu';
        
        return Meerkat.data.products;
    })
      .catch(err=> flash.error = 'Getting Menu failed');
};

Meerkat.addFiveDollarReward = function (memberId, organisationId, jsonToSend) {
    
    var req = {
        method: 'POST',
        url: '/members/' + memberId + '/rewards',
        data: jsonToSend,
        headers: {
            'doshii-organisation-id': organisationId
        }
    };
    
    return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'Reward $5 added';
        return;
    })
    .catch(err => {
        flash.error = 'Reward $5 failed to add: ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
};

Meerkat.cancelOrder = function (order, locationId){
    order.status = 'venue_cancelled'
    if (Meerkat.manuallyAccepted){
        order.manuallyAccepted = true
    } 
    var sendBody = JSON.stringify(order, undefined, 2);;
    
    var req = {
            method: 'PUT',
            url: '/orders/' + order.id,
            data: sendBody,
            headers: {
                'doshii-location-id': locationId
            }
        };

    return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'order cancelled';
        return;
    })
    .catch(err => {
        flash.error = 'Order failed to cancel: ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
    
}

Meerkat.requestrefund = function(transaction, locationId){
    var refundTransaction = {
        'orderId' : transaction.orderId,
        "amount": '-' + transaction.amount,
        "reference": transaction.reference + '1',
        "invoice": transaction.invoice = '1',
        "linkedTrxIds" : [transaction.id]
    };
    var sendBody = JSON.stringify(refundTransaction, undefined, 2);
    var req = {
            method: 'POST',
            url: '/transactions',
            data: sendBody,
            headers: {
                'doshii-location-id': locationId
            }
        };

    return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'order cancelled';
        return;
    })
    .catch(err => {
        flash.error = 'Order failed to cancel: ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
}


Meerkat.requestPayment = function(transaction, locationId){
    
    
    var sendBody = JSON.stringify(transaction, undefined, 2);
    var req = {
            method: 'POST',
            url: '/transactions',
            data: sendBody,
            headers: {
                'doshii-location-id': locationId
            }
        };

    return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'Order paid successfully';
       
        return;
    })
    .catch(err => {
        flash.error = 'Payment Error : ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
}

Meerkat.addFivePercentReward = function (memberId, organisationId, jsonToSend) {

    var req = {
    method: 'POST',
    url: '/members/' + memberId + '/rewards',
    data: jsonToSend,
    headers: {
    'doshii-organisation-id': organisationId
    }
    };

    return $http(req)
    .then(res => {
    var response = angular.copy(res.data);
    console.log(response);
    flash.success = 'Reward $5 added';
    return;
    })
    .catch(err => {
    flash.error = 'Reward $5 failed to add: ' + err.statusText + getErrorMessage(err.data);
    throw err;
    });
};

Meerkat.deleteMember = function (memberId, organisationId) {
    
    return $http.delete('/members/' + memberId, {
        headers: { 'doshii-organisation-id': organisationId }
    })
      .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'Member Deleted';
            return;
        })
      .catch(err=> flash.error = 'Member Delete failed' + err.statusText + getErrorMessage(err.data));
};

Meerkat.updateMember = function (memberId, organisationId, jsonToSend) {
    delete jsonToSend.id;
    delete jsonToSend.uri;
    delete jsonToSend.updatedAt;
    delete jsonToSend.createdAt;
    delete jsonToSend.OrganisationMember;
    delete jsonToSend.ref;
    var req = {
        method: 'PUT',
        url: '/members/' + memberId,
        data: jsonToSend,
        headers: {
        'doshii-organisation-id': organisationId
        }
        };

        return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'Added 50 points';
        return;
        })
        .catch(err => {
        flash.error = 'add fifty points failed: ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
};

Meerkat.createMember = function (jsonToSend, organisationId) {
    var req = {
        method: 'POST',
        url: '/members',
        data: jsonToSend,
        headers: {
        'doshii-organisation-id': organisationId
        }
    };

    return $http(req)
        .then(res => {
        var response = angular.copy(res.data);
        console.log(response);
        flash.success = 'Member Created';
        return;
    })
        .catch(err => {
        flash.error = 'Member Create Failed ' + err.statusText + getErrorMessage(err.data);
        throw err;
    });
};

  Meerkat.getOrder = function(orderId) {
    return $http.get('/orders/' + orderId)
      .catch(err => flash.error = 'Getting order "' + orderId + '" failed');
  };

  Meerkat.sendOrder = function(jsonToSend, locationId) {
    var req = {
      method: 'POST',
      url: '/orders',
      data: jsonToSend,
      headers: {
        'doshii-location-id': locationId
      }
    };

    return $http(req)
      .then(res => {
        var order = angular.copy(res.data);
        console.log(order);
        flash.success = 'Order sent';
        return order;
      })
      .catch(err => {
        flash.error = 'Order not sent: ' + err.statusText + getErrorMessage(err.data);
      });
  };

  Meerkat.sendMultipleOrders = function(jsonToSend, locationId) {
    var step;
    for (step = 0; step < 5; step++){
        setTimeout(Meerkat.sendOrder(jsonToSend,locationId ), step * 500)
    }
  };

  Meerkat.updateTransaction = function(transactionUri) {
    return $http.get(transactionUri)
      .then(res => {
        if (res.data.id === Meerkat.data.pendingTransactions[0].id) {
          Meerkat.data.pendingTransactions[0] = res.data;
        }
      })
      .catch(err => flash.error = 'Updating transaction failed');
  };

  Meerkat.getOrdersForTable = function(tableName, locationId) {
    var req = {
      method: 'GET',
      url: '/tables/' + tableName + '/orders',
      headers: {
        'doshii-location-id': locationId
      }
    };

    return $http(req).catch(err => flash.error = 'Getting orders for table "' + tableName + '" failed');
  };

  Meerkat.getTableFor = function(tableName, locationId) {

    var req = {
      method: 'GET',
      url: '/tables/' + tableName,
      headers: {
        'doshii-location-id': locationId
      }
    };

    return $http(req).catch(err => flash.error = 'Getting table info failed.');
  };

  Meerkat.showPartialPaymentModal = function showPartialPaymentModal(order) {
    return $modal.open({
      templateUrl: 'js/modals/partial_payment_modal.html',
      controller: 'PartialPaymentCtrl',
      resolve: {
        order: _.partial(_.identity, order)
      }
    });
  };

  Meerkat.addPayment = function addPayment(order) {
    var modalInstance = Meerkat.showPartialPaymentModal(order);
    var payments;

    return modalInstance.result.then(function(_payments) {
      if (!_payments) {
        console.error('No payments selected.');
        return;
      }

      payments = _payments;

      return _payments.map(p => $http.post(order.uri + '/transactions', p)
        .then(res => Meerkat.data.pendingTransactions.push(res.data))
        .catch(err => {
          console.log(err);
          throw err;
        }));
    })
      .then(() => flash.success = 'Transaction(s) sent');
  };

  Meerkat.getTransactionsForOrder = function getTransactionsForOrder(order) {
    return $http.get(`/orders/${order.id}/transactions`).then(res => res.data);
  };

  Meerkat.paid = function(order) {
    var req = {
      method: 'PUT',
      url: '/orders/' + order.id,
      data: {
        tip: '0',
        status: 'paid',
        updatedAt: order.updatedAt,
        transactionId: "123",
        invoiceId: "123"
      }
    };

    return $http(req).catch(err => flash.error = 'Updating order failed.');
  };

  Meerkat.complete = function(transaction) {
    var req = {
      method: 'PUT',
      url: transaction.uri,
      data: {
        amount: transaction.amount,
        version: transaction.version,
        status: 'complete',
        reference: 'FakePartnerCash',
        invoice: 'invoice no.'
      }
    };
    
    return $http(req)
      .then(() => Meerkat.data.pendingTransactions.length = 0)
      .catch(err => flash.error = 'Failed to complete transaction: ' + err.message || err);
  };

    Meerkat.getMembers = function (organisationId) {
        return $http.get('/members', {
            headers: { 'doshii-organisation-id': organisationId }
        })
            .then(res => {
                Meerkat.data.members.length = 0;

            Array.prototype.push.apply(Meerkat.data.members, res.data);
            flash.success = 'Updated Members';

            return Meerkat.data.members;
        })
            .catch(err=> flash.error = 'Getting Members failed ' + organisationId );
    };

    Meerkat.getMyPaidTransactions = function (organisationId, locationId) {
        return $http.get('/orders', {
            headers: { 'doshii-location-id': locationId },
            params: {
                'status': "complete",
                'sort' : 'desc',
                'from' : 1497498176
            }
        })
            .then(res => {
                Meerkat.data.posOrders.length = 0;
                Meerkat.data.myTransactions.length = 0;
                Array.prototype.push.apply(Meerkat.data.posOrders, res.data.rows);
                Meerkat.data.posOrders.forEach(function (item){
                    $http.get('/orders/' + item.id + '/transactions', {
                        headers: { 'doshii-location-id': locationId }
                    }).then(transRes => {
                        if (transRes.data !== undefined){
                            Array.prototype.push.apply(Meerkat.data.myTransactions, transRes.data);
                        }
                    })
                })
                flash.success = 'Transactions updated ' + ' test ' + res.data;
                return Meerkat.data.myTransactions;
            })
            .catch(err=> flash.error = 'Getting Transactions failed ' + locationId + ' ' + err);
    };
    
    Meerkat.getPosOrders = function (organisationId, locationId, orderStatus) {
        return $http.get('/orders', {
            headers: { 'doshii-location-id': locationId },
            params: {
                'status': orderStatus,
                'sort' : 'desc',
                'from' : 1497498176
            }
        })
            .then(res => {
                Meerkat.data.posOrders.length = 0;

                Array.prototype.push.apply(Meerkat.data.posOrders, res.data.rows);
                flash.success = 'Updated Orders ' + ' test ' + res.data;

                return Meerkat.data.posOrders;
            })
            .catch(err=> flash.error = 'Getting orders failed ' + locationId + ' ' + err);
    };

    Meerkat.getReservations = function(locationId, fromDate, toDate) {
        var req = {
        method: 'GET',
        url: '/bookings?from=' + fromDate + '&to=' + toDate,
        headers: {
            'doshii-location-id': locationId
        }
        };
        console.debug(req);
        return $http(req)
        .then(res => {
              Meerkat.data.reserves.length = 0;
              Array.prototype.push.apply(Meerkat.data.reserves, res.data);
              flash.success = 'Got Reservations';
              return Meerkat.data.reserves;
              })
        .catch(err => flash.error = 'Getting Reservations failed ' + locationId );
    };
    
    Meerkat.createReservation = function (jsonToSend, locationId) {
        var req = {
        method: 'POST',
        url: '/bookings',
        data: jsonToSend,
        headers: {
            'doshii-location-id': locationId
        }
        };
        
        return $http(req)
        .then(res => {
              var response = angular.copy(res.data);
              console.log(response);
              flash.success = 'Booking Created';
              return;
              })
        .catch(err => {
               flash.error = 'Booking Create Failed ' + err.statusText + getErrorMessage(err.data);
               throw err;
               });
    };
    
  return Meerkat;
}
