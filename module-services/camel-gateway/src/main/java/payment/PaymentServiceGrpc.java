package payment;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Payment Service for unemployment claim processing
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: payment.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class PaymentServiceGrpc {

  private PaymentServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "payment.PaymentService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<payment.Payment.RegisterRequest,
      payment.Payment.RegisterResponse> getRegisterServiceMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RegisterService",
      requestType = payment.Payment.RegisterRequest.class,
      responseType = payment.Payment.RegisterResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<payment.Payment.RegisterRequest,
      payment.Payment.RegisterResponse> getRegisterServiceMethod() {
    io.grpc.MethodDescriptor<payment.Payment.RegisterRequest, payment.Payment.RegisterResponse> getRegisterServiceMethod;
    if ((getRegisterServiceMethod = PaymentServiceGrpc.getRegisterServiceMethod) == null) {
      synchronized (PaymentServiceGrpc.class) {
        if ((getRegisterServiceMethod = PaymentServiceGrpc.getRegisterServiceMethod) == null) {
          PaymentServiceGrpc.getRegisterServiceMethod = getRegisterServiceMethod =
              io.grpc.MethodDescriptor.<payment.Payment.RegisterRequest, payment.Payment.RegisterResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RegisterService"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.RegisterRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.RegisterResponse.getDefaultInstance()))
              .setSchemaDescriptor(new PaymentServiceMethodDescriptorSupplier("RegisterService"))
              .build();
        }
      }
    }
    return getRegisterServiceMethod;
  }

  private static volatile io.grpc.MethodDescriptor<payment.Payment.HeartbeatRequest,
      payment.Payment.HeartbeatResponse> getSendHeartbeatMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SendHeartbeat",
      requestType = payment.Payment.HeartbeatRequest.class,
      responseType = payment.Payment.HeartbeatResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<payment.Payment.HeartbeatRequest,
      payment.Payment.HeartbeatResponse> getSendHeartbeatMethod() {
    io.grpc.MethodDescriptor<payment.Payment.HeartbeatRequest, payment.Payment.HeartbeatResponse> getSendHeartbeatMethod;
    if ((getSendHeartbeatMethod = PaymentServiceGrpc.getSendHeartbeatMethod) == null) {
      synchronized (PaymentServiceGrpc.class) {
        if ((getSendHeartbeatMethod = PaymentServiceGrpc.getSendHeartbeatMethod) == null) {
          PaymentServiceGrpc.getSendHeartbeatMethod = getSendHeartbeatMethod =
              io.grpc.MethodDescriptor.<payment.Payment.HeartbeatRequest, payment.Payment.HeartbeatResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SendHeartbeat"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.HeartbeatRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.HeartbeatResponse.getDefaultInstance()))
              .setSchemaDescriptor(new PaymentServiceMethodDescriptorSupplier("SendHeartbeat"))
              .build();
        }
      }
    }
    return getSendHeartbeatMethod;
  }

  private static volatile io.grpc.MethodDescriptor<payment.Payment.StatusRequest,
      payment.Payment.ClaimsResponse> getGetClaimsByStatusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetClaimsByStatus",
      requestType = payment.Payment.StatusRequest.class,
      responseType = payment.Payment.ClaimsResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<payment.Payment.StatusRequest,
      payment.Payment.ClaimsResponse> getGetClaimsByStatusMethod() {
    io.grpc.MethodDescriptor<payment.Payment.StatusRequest, payment.Payment.ClaimsResponse> getGetClaimsByStatusMethod;
    if ((getGetClaimsByStatusMethod = PaymentServiceGrpc.getGetClaimsByStatusMethod) == null) {
      synchronized (PaymentServiceGrpc.class) {
        if ((getGetClaimsByStatusMethod = PaymentServiceGrpc.getGetClaimsByStatusMethod) == null) {
          PaymentServiceGrpc.getGetClaimsByStatusMethod = getGetClaimsByStatusMethod =
              io.grpc.MethodDescriptor.<payment.Payment.StatusRequest, payment.Payment.ClaimsResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetClaimsByStatus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.StatusRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.ClaimsResponse.getDefaultInstance()))
              .setSchemaDescriptor(new PaymentServiceMethodDescriptorSupplier("GetClaimsByStatus"))
              .build();
        }
      }
    }
    return getGetClaimsByStatusMethod;
  }

  private static volatile io.grpc.MethodDescriptor<payment.Payment.PaymentUpdateRequest,
      payment.Payment.PaymentUpdateResponse> getUpdateClaimPaymentMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UpdateClaimPayment",
      requestType = payment.Payment.PaymentUpdateRequest.class,
      responseType = payment.Payment.PaymentUpdateResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<payment.Payment.PaymentUpdateRequest,
      payment.Payment.PaymentUpdateResponse> getUpdateClaimPaymentMethod() {
    io.grpc.MethodDescriptor<payment.Payment.PaymentUpdateRequest, payment.Payment.PaymentUpdateResponse> getUpdateClaimPaymentMethod;
    if ((getUpdateClaimPaymentMethod = PaymentServiceGrpc.getUpdateClaimPaymentMethod) == null) {
      synchronized (PaymentServiceGrpc.class) {
        if ((getUpdateClaimPaymentMethod = PaymentServiceGrpc.getUpdateClaimPaymentMethod) == null) {
          PaymentServiceGrpc.getUpdateClaimPaymentMethod = getUpdateClaimPaymentMethod =
              io.grpc.MethodDescriptor.<payment.Payment.PaymentUpdateRequest, payment.Payment.PaymentUpdateResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UpdateClaimPayment"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.PaymentUpdateRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  payment.Payment.PaymentUpdateResponse.getDefaultInstance()))
              .setSchemaDescriptor(new PaymentServiceMethodDescriptorSupplier("UpdateClaimPayment"))
              .build();
        }
      }
    }
    return getUpdateClaimPaymentMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static PaymentServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PaymentServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PaymentServiceStub>() {
        @java.lang.Override
        public PaymentServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PaymentServiceStub(channel, callOptions);
        }
      };
    return PaymentServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static PaymentServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PaymentServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PaymentServiceBlockingStub>() {
        @java.lang.Override
        public PaymentServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PaymentServiceBlockingStub(channel, callOptions);
        }
      };
    return PaymentServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static PaymentServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PaymentServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PaymentServiceFutureStub>() {
        @java.lang.Override
        public PaymentServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PaymentServiceFutureStub(channel, callOptions);
        }
      };
    return PaymentServiceFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Payment Service for unemployment claim processing
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * Service registration with Camel Gateway
     * </pre>
     */
    default void registerService(payment.Payment.RegisterRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.RegisterResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRegisterServiceMethod(), responseObserver);
    }

    /**
     * <pre>
     * Heartbeat to maintain connection
     * </pre>
     */
    default void sendHeartbeat(payment.Payment.HeartbeatRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.HeartbeatResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSendHeartbeatMethod(), responseObserver);
    }

    /**
     * <pre>
     * Get claims by status from Camel Gateway
     * </pre>
     */
    default void getClaimsByStatus(payment.Payment.StatusRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.ClaimsResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetClaimsByStatusMethod(), responseObserver);
    }

    /**
     * <pre>
     * Update claim status and payment info back to Camel
     * </pre>
     */
    default void updateClaimPayment(payment.Payment.PaymentUpdateRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.PaymentUpdateResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getUpdateClaimPaymentMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service PaymentService.
   * <pre>
   * Payment Service for unemployment claim processing
   * </pre>
   */
  public static abstract class PaymentServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return PaymentServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service PaymentService.
   * <pre>
   * Payment Service for unemployment claim processing
   * </pre>
   */
  public static final class PaymentServiceStub
      extends io.grpc.stub.AbstractAsyncStub<PaymentServiceStub> {
    private PaymentServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PaymentServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PaymentServiceStub(channel, callOptions);
    }

    /**
     * <pre>
     * Service registration with Camel Gateway
     * </pre>
     */
    public void registerService(payment.Payment.RegisterRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.RegisterResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRegisterServiceMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Heartbeat to maintain connection
     * </pre>
     */
    public void sendHeartbeat(payment.Payment.HeartbeatRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.HeartbeatResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSendHeartbeatMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Get claims by status from Camel Gateway
     * </pre>
     */
    public void getClaimsByStatus(payment.Payment.StatusRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.ClaimsResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetClaimsByStatusMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Update claim status and payment info back to Camel
     * </pre>
     */
    public void updateClaimPayment(payment.Payment.PaymentUpdateRequest request,
        io.grpc.stub.StreamObserver<payment.Payment.PaymentUpdateResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getUpdateClaimPaymentMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service PaymentService.
   * <pre>
   * Payment Service for unemployment claim processing
   * </pre>
   */
  public static final class PaymentServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<PaymentServiceBlockingStub> {
    private PaymentServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PaymentServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PaymentServiceBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Service registration with Camel Gateway
     * </pre>
     */
    public payment.Payment.RegisterResponse registerService(payment.Payment.RegisterRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRegisterServiceMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Heartbeat to maintain connection
     * </pre>
     */
    public payment.Payment.HeartbeatResponse sendHeartbeat(payment.Payment.HeartbeatRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSendHeartbeatMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Get claims by status from Camel Gateway
     * </pre>
     */
    public payment.Payment.ClaimsResponse getClaimsByStatus(payment.Payment.StatusRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetClaimsByStatusMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Update claim status and payment info back to Camel
     * </pre>
     */
    public payment.Payment.PaymentUpdateResponse updateClaimPayment(payment.Payment.PaymentUpdateRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getUpdateClaimPaymentMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service PaymentService.
   * <pre>
   * Payment Service for unemployment claim processing
   * </pre>
   */
  public static final class PaymentServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<PaymentServiceFutureStub> {
    private PaymentServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PaymentServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PaymentServiceFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Service registration with Camel Gateway
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<payment.Payment.RegisterResponse> registerService(
        payment.Payment.RegisterRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRegisterServiceMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Heartbeat to maintain connection
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<payment.Payment.HeartbeatResponse> sendHeartbeat(
        payment.Payment.HeartbeatRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSendHeartbeatMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Get claims by status from Camel Gateway
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<payment.Payment.ClaimsResponse> getClaimsByStatus(
        payment.Payment.StatusRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetClaimsByStatusMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Update claim status and payment info back to Camel
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<payment.Payment.PaymentUpdateResponse> updateClaimPayment(
        payment.Payment.PaymentUpdateRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getUpdateClaimPaymentMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_REGISTER_SERVICE = 0;
  private static final int METHODID_SEND_HEARTBEAT = 1;
  private static final int METHODID_GET_CLAIMS_BY_STATUS = 2;
  private static final int METHODID_UPDATE_CLAIM_PAYMENT = 3;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_REGISTER_SERVICE:
          serviceImpl.registerService((payment.Payment.RegisterRequest) request,
              (io.grpc.stub.StreamObserver<payment.Payment.RegisterResponse>) responseObserver);
          break;
        case METHODID_SEND_HEARTBEAT:
          serviceImpl.sendHeartbeat((payment.Payment.HeartbeatRequest) request,
              (io.grpc.stub.StreamObserver<payment.Payment.HeartbeatResponse>) responseObserver);
          break;
        case METHODID_GET_CLAIMS_BY_STATUS:
          serviceImpl.getClaimsByStatus((payment.Payment.StatusRequest) request,
              (io.grpc.stub.StreamObserver<payment.Payment.ClaimsResponse>) responseObserver);
          break;
        case METHODID_UPDATE_CLAIM_PAYMENT:
          serviceImpl.updateClaimPayment((payment.Payment.PaymentUpdateRequest) request,
              (io.grpc.stub.StreamObserver<payment.Payment.PaymentUpdateResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getRegisterServiceMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              payment.Payment.RegisterRequest,
              payment.Payment.RegisterResponse>(
                service, METHODID_REGISTER_SERVICE)))
        .addMethod(
          getSendHeartbeatMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              payment.Payment.HeartbeatRequest,
              payment.Payment.HeartbeatResponse>(
                service, METHODID_SEND_HEARTBEAT)))
        .addMethod(
          getGetClaimsByStatusMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              payment.Payment.StatusRequest,
              payment.Payment.ClaimsResponse>(
                service, METHODID_GET_CLAIMS_BY_STATUS)))
        .addMethod(
          getUpdateClaimPaymentMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              payment.Payment.PaymentUpdateRequest,
              payment.Payment.PaymentUpdateResponse>(
                service, METHODID_UPDATE_CLAIM_PAYMENT)))
        .build();
  }

  private static abstract class PaymentServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PaymentServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return payment.Payment.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("PaymentService");
    }
  }

  private static final class PaymentServiceFileDescriptorSupplier
      extends PaymentServiceBaseDescriptorSupplier {
    PaymentServiceFileDescriptorSupplier() {}
  }

  private static final class PaymentServiceMethodDescriptorSupplier
      extends PaymentServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    PaymentServiceMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (PaymentServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new PaymentServiceFileDescriptorSupplier())
              .addMethod(getRegisterServiceMethod())
              .addMethod(getSendHeartbeatMethod())
              .addMethod(getGetClaimsByStatusMethod())
              .addMethod(getUpdateClaimPaymentMethod())
              .build();
        }
      }
    }
    return result;
  }
}
