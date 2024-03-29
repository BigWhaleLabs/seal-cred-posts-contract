//                                                                        ,-,
//                            *                      .                   /.(              .
//                                       \|/                             \ {
//    .                 _    .  ,   .    -*-       .                      `-`
//     ,'-.         *  / \_ *  / \_      /|\         *   /\'__        *.                 *
//    (____".         /    \  /    \,     __      .    _/  /  \  * .               .
//               .   /\/\  /\/ :' __ \_  /  \       _^/  ^/    `—./\    /\   .
//   *       _      /    \/  \  _/  \-‘\/  ` \ /\  /.' ^_   \_   .’\\  /_/\           ,'-.
//          /_\   /\  .-   `. \/     \ /.     /  \ ;.  _/ \ -. `_/   \/.   \   _     (____".    *
//     .   /   \ /  `-.__ ^   / .-'.--\      -    \/  _ `--./ .-'  `-/.     \ / \             .
//        /     /.       `.  / /       `.   /   `  .-'      '-._ `._         /.  \
// ~._,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'
// ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~~
// ~~    ~~~~    ~~~~     ~~~~   ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~
//     ~~     ~~      ~~      ~~      ~~      ~~      ~~      ~~       ~~     ~~      ~~      ~~
//                          ๐
//                                                                              _
//                                                  ₒ                         ><_>
//                                  _______     __      _______
//          .-'                    |   _  "\   |" \    /" _   "|                               ๐
//     '--./ /     _.---.          (. |_)  :)  ||  |  (: ( \___)
//     '-,  (__..-`       \        |:     \/   |:  |   \/ \
//        \          .     |       (|  _  \\   |.  |   //  \ ___
//         `,.__.   ,__.--/        |: |_)  :)  |\  |   (:   _(  _|
//           '._/_.'___.-`         (_______/   |__\|    \_______)                 ๐
//
//                  __   __  ___   __    __         __       ___         _______
//                 |"  |/  \|  "| /" |  | "\       /""\     |"  |       /"     "|
//      ๐          |'  /    \:  |(:  (__)  :)     /    \    ||  |      (: ______)
//                 |: /'        | \/      \/     /' /\  \   |:  |   ₒ   \/    |
//                  \//  /\'    | //  __  \\    //  __'  \   \  |___    // ___)_
//                  /   /  \\   |(:  (  )  :)  /   /  \\  \ ( \_|:  \  (:      "|
//                 |___/    \___| \__|  |__/  (___/    \___) \_______)  \_______)
//                                                                                     ₒ৹
//                          ___             __       _______     ________
//         _               |"  |     ₒ     /""\     |   _  "\   /"       )
//       ><_>              ||  |          /    \    (. |_)  :) (:   \___/
//                         |:  |         /' /\  \   |:     \/   \___  \
//                          \  |___     //  __'  \  (|  _  \\    __/  \\          \_____)\_____
//                         ( \_|:  \   /   /  \\  \ |: |_)  :)  /" \   :)         /--v____ __`<
//                          \_______) (___/    \___)(_______/  (_______/                  )/
//                                                                                        '
//
//            ๐                          .    '    ,                                           ₒ
//                         ₒ               _______
//                                 ____  .`_|___|_`.  ____
//                                        \ \   / /                        ₒ৹
//                                          \ ' /                         ๐
//   ₒ                                        \/
//                                   ₒ     /      \       )                                 (
//           (   ₒ৹               (                      (                                  )
//            )                   )               _      )                )                (
//           (        )          (       (      ><_>    (       (        (                  )
//     )      )      (     (      )       )              )       )        )         )      (
//    (      (        )     )    (       (              (       (        (         (        )
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "./models/Post.sol";
import "./interfaces/ILedger.sol";
import "./libraries/Strings.sol";

uint256 constant symbolSuffixLength = 2; // "-d" in the end of the derivative symbol

/**
 * @title SealCred Post storage
 * @dev Allows owners of derivatives to add posts
 */
contract SCPostStorage is Ownable, ERC2771Recipient, Versioned {
  using Counters for Counters.Counter;
  using strings for *;

  // State
  address public immutable ledgerAddress;
  Post[] public posts;
  uint256 public maxPostLength;
  uint256 public infixLength;
  Counters.Counter public currentPostId;
  address public replyAllAddress;

  // Events
  event PostSaved(
    uint256 id,
    string post,
    address indexed derivativeAddress,
    address indexed sender,
    uint256 timestamp,
    uint256 threadId,
    bytes32 replyToId
  );

  constructor(
    address _ledgerAddress,
    uint256 _maxPostLength,
    uint256 _infixLength,
    address _forwarder,
    string memory _version,
    address _replyAllAddress
  ) Versioned(_version) {
    ledgerAddress = _ledgerAddress;
    maxPostLength = _maxPostLength;
    infixLength = _infixLength;
    _setTrustedForwarder(_forwarder);
    version = _version;
    replyAllAddress = _replyAllAddress;
  }

  /**
   * @dev Modifies max post length
   */
  function setMaxPostLength(uint256 _maxPostLength) external onlyOwner {
    maxPostLength = _maxPostLength;
  }

  /**
   * @dev Modifies infix length
   */
  function setInfixLength(uint256 _infixLength) external onlyOwner {
    infixLength = _infixLength;
  }

  /**
   * @dev Modifies reply all address
   */
  function setReplyAllAddress(address _replyAllAddress) external onlyOwner {
    replyAllAddress = _replyAllAddress;
  }

  /**
   * @dev Returns posts
   */
  function getPosts(
    uint256 _skip,
    uint256 _limit
  ) external view returns (Post[] memory) {
    if (_skip > posts.length) {
      return new Post[](0);
    }
    if (posts.length == 0) {
      return new Post[](0);
    }
    uint256 length = _skip + _limit > posts.length - 1
      ? posts.length - _skip
      : _limit;
    Post[] memory allPosts = new Post[](length);
    for (uint256 i = 0; i < length; i++) {
      Post storage post = posts[_skip + i];
      allPosts[i] = post;
    }
    return allPosts;
  }

  /**
   * @dev Returns thread
   */
  function getThread(uint256 _threadId) external view returns (Post[] memory) {
    uint256 postsLength = posts.length;
    Post[] memory _posts = new Post[](postsLength);
    for (uint256 i = 0; i < postsLength; ) {
      Post storage currentPost = posts[i];
      if (currentPost.threadId == _threadId) {
        _posts[i] = currentPost;
      }
      unchecked {
        ++i;
      }
    }

    return _posts;
  }

  /**
   * @dev Adds a post to the storage
   */
  function savePost(
    string memory post,
    string memory original,
    uint256 threadId,
    bytes32 replyToId
  ) external {
    // Get the derivative
    address derivativeAddress = ILedger(ledgerAddress).getDerivative(original);
    // Check preconditions
    require(derivativeAddress != address(0), "Derivative contract not found");
    require(
      IERC721(derivativeAddress).balanceOf(_msgSender()) > 0,
      "You do not own this derivative"
    );
    require(
      maxPostLength >=
        post.toSlice().len() +
          infixLength +
          bytes(IERC721Metadata(derivativeAddress).symbol()).length -
          symbolSuffixLength,
      "Post exceeds max post length"
    );
    require(threadId <= currentPostId.current(), "Thread not found");
    // Check abitily to post
    if (threadId > 0) {
      require(replyToId.length > 0, "replyToId must be provided with threadId");
      Post memory threadPost = posts[threadId - 1];
      require(
        threadPost.sender == _msgSender() ||
          threadPost.sender == replyAllAddress,
        "You can only reply to your own thread or to the thread of replyAllAddress"
      );
    }
    // Increment the current post id
    currentPostId.increment();
    // Post the post
    uint256 id = currentPostId.current();
    Post memory newPost = Post(
      id,
      post,
      derivativeAddress,
      _msgSender(),
      block.timestamp,
      threadId,
      replyToId
    );
    posts.push(newPost);
    // Emit the psot event
    emit PostSaved(
      id,
      post,
      derivativeAddress,
      _msgSender(),
      block.timestamp,
      threadId,
      replyToId
    );
  }

  function _msgSender()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (address sender)
  {
    sender = ERC2771Recipient._msgSender();
  }

  function _msgData()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (bytes calldata ret)
  {
    return ERC2771Recipient._msgData();
  }
}
