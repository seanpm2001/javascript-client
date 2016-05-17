
function testContinusec(idx) {
	switch(idx) {
	case 0:
		var client = new ContinusecClient("7981306761429961588", "c9fc80d4e19ddbf01a4e6b5277a29e1bffa88fe047af9d0b9b36de536f85c2c6", "http://localhost:8080");
		var log = client.getVerifiableLog("newtestlog");
		log.getTreeHead(0, function (treeHead) {
			throw "expected failure";
		}, function (reason) {
			if (reason != CONTINUSEC_NOT_FOUND_ERROR) {
				throw reason;
			}
			testContinusec(idx+1);
		});
		break;
	case 1: 
		var client = new ContinusecClient("7981306761429961588", "wrongcred", "http://localhost:8080");
		var log = client.getVerifiableLog("newtestlog");
		log.getTreeHead(0, function (treeHead) {
			throw "expected failure";
		}, function (reason) {
			if (reason != CONTINUSEC_UNAUTHORIZED_ERROR) {
				throw reason;
			}
			testContinusec(idx+1);
		});
		break;
	case 2: 
		var client = new ContinusecClient("wrongaccount", "wrongcred", "http://localhost:8080");
		var log = client.getVerifiableLog("newtestlog");
		log.getTreeHead(0, function (treeHead) {
			throw "expected failure";
		}, function (reason) {
			if (reason != CONTINUSEC_NOT_FOUND_ERROR) {
				throw reason;
			}
			testContinusec(idx+1);
		});
		break;
	case 3: 
		var client = new ContinusecClient("7981306761429961588", "c9fc80d4e19ddbf01a4e6b5277a29e1bffa88fe047af9d0b9b36de536f85c2c6", "http://localhost:8080");
		var log = client.getVerifiableLog("newtestlog");
		log.create(function () {
			log.create(function () {
				throw "expected failure";
			}, function (reason) {
				if (reason != CONTINUSEC_OBJECT_CONFLICT_ERROR) {
					throw reason;
				}
				testContinusec(idx+1);
			});
		}, function (reason) {
			throw reason;
		});
		break;
	}
}

/*
	client = new ContinusecClient("7981306761429961588", "c9fc80d4e19ddbf01a4e6b5277a29e1bffa88fe047af9d0b9b36de536f85c2c6", "http://localhost:8080");
	log = client.getVerifiableLog("newtestlog");
	log.create();

	try {
		log.create();
		throw new RuntimeException();
	} catch (ObjectConflictException e) {
		// good
	}

	log.add(new RawDataEntry("foo".getBytes()));
	log.add(new JsonEntry("{\"name\":\"adam\",\"ssn\":123.45}".getBytes()));
	log.add(new RedactableJsonEntry("{\"name\":\"adam\",\"ssn\":123.45}".getBytes()));

	AddEntryResponse aer = log.add(new RawDataEntry("foo".getBytes()));
	log.blockUntilPresent(aer);

	LogTreeHead head = log.getTreeHead(client.HEAD);
	if (head.getTreeSize() != 3) {
		throw new RuntimeException();
	}

	for (int i = 0; i < 100; i++) {
		log.add(new RawDataEntry(("foo-"+i).getBytes()));
	}

	LogTreeHead head103 = log.getVerifiedLatestTreeHead(head);
	if (head103.getTreeSize() != 103) {
		throw new RuntimeException();
	}

	try {
		log.verifyInclusion(head103, new RawDataEntry(("foo27").getBytes()));
		throw new RuntimeException();
	} catch (ObjectNotFoundException e) {
		// good
	}

	LogInclusionProof inclProof = log.getInclusionProof(head103.getTreeSize(), new RawDataEntry(("foo-27").getBytes()));
	inclProof.verify(head103);

	try {
		inclProof.verify(head);
		throw new RuntimeException();
	} catch (VerificationFailedException e) {
		// good
	}

	LogTreeHead head50 = log.getTreeHead(50);
	if (head50.getTreeSize() != 50) {
		throw new RuntimeException();
	}

	LogConsistencyProof cons = log.getConsistencyProof(head50.getTreeSize(), head103.getTreeSize());
	cons.verify(head50, head103);

	try {
		cons.verify(head, head103);
		throw new RuntimeException();
	} catch (VerificationFailedException e) {
		// good
	}

	inclProof = log.getInclusionProof(10, new RawDataEntry("foo".getBytes()));

	LogTreeHead h10 = log.verifySuppliedInclusionProof(head103, inclProof);
	if (h10.getTreeSize() != 10) {
		throw new RuntimeException();
	}


	final int[] count = new int[1];

	count[0] = 0;
	log.verifyEntries(LogTreeHead.ZeroLogTreeHead, head103, RawDataEntryFactory.getInstance(), new LogAuditor() {
		public void auditLogEntry(int idx, VerifiableEntry e) throws ContinusecException {
			e.getData();
			count[0]++;
		}
	});
	if (count[0] != 103) {
		throw new RuntimeException();
	}

	LogTreeHead head1 = log.getTreeHead(1);
	count[0] = 0;
	try {
		log.verifyEntries(head1, head103, JsonEntryFactory.getInstance(), new LogAuditor() {
			public void auditLogEntry(int idx, VerifiableEntry e) throws ContinusecException {
				e.getData();
				count[0]++;
			}
		});
		throw new RuntimeException();
	} catch (NotAllEntriesReturnedException e) {
		// good
	}
	if (count[0] != 0) {
		throw new RuntimeException();
	}

	LogTreeHead head3 = log.getTreeHead(3);
	count[0] = 0;
	log.verifyEntries(head1, head3, JsonEntryFactory.getInstance(), new LogAuditor() {
		public void auditLogEntry(int idx, VerifiableEntry e) throws ContinusecException {
			e.getData();
			count[0]++;
		}
	});
	if (count[0] != 2) {
		throw new RuntimeException();
	}

	count[0] = 0;
	log.verifyEntries(head50, head103, RawDataEntryFactory.getInstance(), new LogAuditor() {
		public void auditLogEntry(int idx, VerifiableEntry e) throws ContinusecException {
			e.getData();
			count[0]++;
		}
	});
	if (count[0] != 53) {
		throw new RuntimeException();
	}

	JsonEntry je = new JsonEntry("{	\"ssn\":  123.4500 ,   \"name\" :  \"adam\"}".getBytes());
	log.verifyInclusion(head103, je);

	VerifiableEntry redEnt = log.get(2, RedactedJsonEntryFactory.getInstance());
	String dd = new String(redEnt.getData());
	if (dd.indexOf("ssn") >= 0) {
		throw new RuntimeException();
	}
	if (dd.indexOf("adam") < 0) {
		throw new RuntimeException();
	}
	log.verifyInclusion(head103, redEnt);

	client = new ContinusecClient("7981306761429961588", "allseeing", "http://localhost:8080");
	log = client.getVerifiableLog("newtestlog");

	redEnt = log.get(2, RedactedJsonEntryFactory.getInstance());
	dd = new String(redEnt.getData());
	if (dd.indexOf("123.45") < 0) {
		throw new RuntimeException();
	}
	if (dd.indexOf("adam") < 0) {
		throw new RuntimeException();
	}
	log.verifyInclusion(head103, redEnt);

	VerifiableMap map = client.getVerifiableMap("nnewtestmap");
	try {
		map.getTreeHead(client.HEAD);
		throw new RuntimeException();
	} catch (ObjectNotFoundException e) {
		// good
	}

	map.create();
	try {
		map.create();
		throw new RuntimeException();
	} catch (ObjectConflictException e) {
		// good
	}

	map.set("foo".getBytes(), new RawDataEntry("foo".getBytes()));
	map.set("fiz".getBytes(), new JsonEntry("{\"name\":\"adam\",\"ssn\":123.45}".getBytes()));
	AddEntryResponse waitResponse = map.set("foz".getBytes(), new RedactableJsonEntry("{\"name\":\"adam\",\"ssn\":123.45}".getBytes()));

	for (int i = 0; i < 100; i++) {
		map.set(("foo"+i).getBytes(), new RawDataEntry(("fooval"+i).getBytes()));
	}

	map.delete("foo".getBytes());
	map.delete("foodddd".getBytes());
	map.delete("foo27".getBytes());

	LogTreeHead mlHead = map.getMutationLog().blockUntilPresent(waitResponse);
	if (mlHead.getTreeSize() != 106) {
		throw new RuntimeException();
	}

	MapTreeHead mrHead = map.blockUntilSize(mlHead.getTreeSize());
	if (mrHead.getMutationLogTreeHead().getTreeSize() != 106) {
		throw new RuntimeException();
	}
	MapGetEntryResponse entryResp = map.get("foo".getBytes(), mrHead.getTreeSize(), RawDataEntryFactory.getInstance());
	entryResp.verify(mrHead);

	dd = new String(entryResp.getValue().getData());
	if (dd.length() > 0) {
		throw new RuntimeException();
	}

	entryResp = map.get("foo-29".getBytes(), mrHead.getTreeSize(), RawDataEntryFactory.getInstance());
	entryResp.verify(mrHead);

	dd = new String(entryResp.getValue().getData());
	if (dd.length() > 0) {
		throw new RuntimeException();
	}

	entryResp = map.get("foo29".getBytes(), mrHead.getTreeSize(), RawDataEntryFactory.getInstance());
	entryResp.verify(mrHead);

	dd = new String(entryResp.getValue().getData());
	if (!"fooval29".equals(dd)) {
		throw new RuntimeException();
	}

	MapTreeState mapState106 = map.getVerifiedLatestMapState(null);
	map.getVerifiedMapState(mapState106, 0);
	MapTreeState mapState2 = map.getVerifiedMapState(mapState106, 2);

	if (mapState2.getTreeSize() != 2) {
		throw new RuntimeException();
	}

	VerifiableEntry ve = map.getVerifiedValue("foo".getBytes(), mapState2, RawDataEntryFactory.getInstance());
	if (!"foo".equals(new String(ve.getData()))) {
		throw new RuntimeException();
	}*/

