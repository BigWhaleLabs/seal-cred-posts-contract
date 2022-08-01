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
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/ISCEmailLedger.sol";
import "./models/Post.sol";

/**
 * @title SealCred Posts storage
 * @dev Allows owners of SCEmailDerivative to post posts
 */
contract SCEmailPosts is Ownable {
  using Counters for Counters.Counter;

  // State
  Post[] public posts;
  address public immutable sealCredEmailLedgerAddress;
  uint256 public maxPostLength;
  uint256 public infixLength;
  Counters.Counter public currentPostId;

  // Events
  event PostSaved(
    uint256 id,
    string post,
    address indexed derivativeAddress,
    address indexed sender,
    uint256 timestamp
  );

  constructor(
    address _sealCredEmailLedgerAddress,
    uint256 _maxPostLength,
    uint256 _infixLength
  ) {
    sealCredEmailLedgerAddress = _sealCredEmailLedgerAddress;
    maxPostLength = _maxPostLength;
    infixLength = _infixLength;
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
   * @dev Posts a new post given that msg.sender is an owner of a SCEmailDerivative
   */
  function savePost(string memory post, string memory domain) external {
    // Get the derivative
    address derivativeAddress = ISCEmailLedger(sealCredEmailLedgerAddress)
      .getDerivativeContract(domain);
    // Check preconditions
    require(derivativeAddress != address(0), "Derivative contract not found");
    require(
      IERC721(derivativeAddress).balanceOf(msg.sender) > 0,
      "You do not own this derivative"
    );
    require(
      maxPostLength > bytes(post).length + infixLength + bytes(domain).length,
      "Post exceeds max post length"
    );
    // Post the post
    uint256 id = currentPostId.current();
    Post memory newPost = Post(
      id,
      post,
      derivativeAddress,
      msg.sender,
      block.timestamp
    );
    posts.push(newPost);
    // Emit the psot event
    emit PostSaved(id, post, derivativeAddress, msg.sender, block.timestamp);
    // Increment the current post id
    currentPostId.increment();
  }

  /**
   * @dev Returns all posts
   */
  function getAllPosts() external view returns (Post[] memory) {
    uint256 postsLength = posts.length;
    Post[] memory allPosts = new Post[](postsLength);
    for (uint256 i = 0; i < postsLength; i++) {
      Post storage post = posts[i];
      allPosts[i] = post;
    }
    return allPosts;
  }
}
