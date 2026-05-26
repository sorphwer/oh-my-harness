# Protobuf And HTTP Patterns

Use these patterns when the project is protobuf-first, or when you want a concrete template to map into OpenAPI or framework routes.

## Resource Example

```proto
message Book {
  option (google.api.resource) = {
    type: "library.googleapis.com/Book"
    pattern: "publishers/{publisher}/books/{book}"
    singular: "book"
    plural: "books"
  };

  string name = 1 [(google.api.field_behavior) = IDENTIFIER];
  string title = 2 [(google.api.field_behavior) = REQUIRED];
  string description = 3;
  string etag = 4;
  google.protobuf.Timestamp create_time = 5
      [(google.api.field_behavior) = OUTPUT_ONLY];
}
```

## Standard Methods

```proto
service LibraryService {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      get: "/v1/{name=publishers/*/books/*}"
    };
  }

  rpc ListBooks(ListBooksRequest) returns (ListBooksResponse) {
    option (google.api.http) = {
      get: "/v1/{parent=publishers/*}/books"
    };
  }

  rpc CreateBook(CreateBookRequest) returns (Book) {
    option (google.api.http) = {
      post: "/v1/{parent=publishers/*}/books"
      body: "book"
    };
  }

  rpc UpdateBook(UpdateBookRequest) returns (Book) {
    option (google.api.http) = {
      patch: "/v1/{book.name=publishers/*/books/*}"
      body: "book"
    };
  }

  rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = {
      delete: "/v1/{name=publishers/*/books/*}"
    };
  }

  rpc ApproveBook(ApproveBookRequest) returns (Book) {
    option (google.api.http) = {
      post: "/v1/{name=publishers/*/books/*}:approve"
      body: "*"
    };
  }
}
```

## Request Shapes

```proto
message GetBookRequest {
  string name = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = { type: "library.googleapis.com/Book" }
  ];
}

message ListBooksRequest {
  string parent = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = { child_type: "library.googleapis.com/Book" }
  ];
  int32 page_size = 2;
  string page_token = 3;
  string filter = 4;
  string order_by = 5;
}

message ListBooksResponse {
  repeated Book books = 1;
  string next_page_token = 2;
}

message CreateBookRequest {
  string parent = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = { child_type: "library.googleapis.com/Book" }
  ];
  Book book = 2 [(google.api.field_behavior) = REQUIRED];
  string book_id = 3;
  string request_id = 4;
}

message UpdateBookRequest {
  Book book = 1 [(google.api.field_behavior) = REQUIRED];
  google.protobuf.FieldMask update_mask = 2;
  string request_id = 3;
}

message DeleteBookRequest {
  string name = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = { type: "library.googleapis.com/Book" }
  ];
  string etag = 2;
  string request_id = 3;
}

message ApproveBookRequest {
  string name = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = { type: "library.googleapis.com/Book" }
  ];
  string reason = 2;
}
```

## Review Notes

- `Get` and `Delete` requests should usually start with `name`.
- `List` requests should usually start with `parent`.
- `Create` requests should usually contain `parent`, the resource body, then `<resource>_id`.
- `Update` should use the resource body plus `update_mask`; PATCH is partial by default.
- Only add `etag`, `request_id`, `allow_missing`, or `validate_only` when the product behavior justifies them.

## REST And OpenAPI Translation

When you are not using protobuf directly:

- Keep the same canonical paths, for example `/v1/publishers/{publisher}/books/{book}`.
- Keep list query params named `pageSize`, `pageToken`, `filter`, and `orderBy`, or document the deviation if the project must stay snake_case.
- Keep partial update semantics explicit with `PATCH` and `updateMask`.
- Keep custom actions as `POST /v1/publishers/{publisher}/books/{book}:approve`.
- Keep response envelopes aligned with the AIP intent even if your framework prefers a different local naming style.
